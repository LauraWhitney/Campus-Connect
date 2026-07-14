from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional
import math
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.core.notify import notify_user, notify_admins
from app.models.user import User
from app.models.club import Club, ClubMembershipRequest, MembershipStatus, ClubApprovalStatus
from app.models.activity_log import ActivityLog
from app.schemas.schemas import ClubCreate, ClubOut, ClubListResponse

router = APIRouter(prefix="/clubs", tags=["clubs"])
PAGE_SIZE = 12


def _log(db: Session, action: str, detail: str, user: User):
    db.add(ActivityLog(
        user_id=user.id, user_email=user.email,
        action=action, detail=detail[:500],
    ))


def _club_out(club: Club, current_user: Optional[User]) -> dict:
    is_member    = False
    has_pending  = False
    is_owner     = False
    if current_user:
        is_owner = club.created_by == current_user.id
        req = next((r for r in club.membership_requests if r.user_id == current_user.id), None)
        if req:
            is_member   = req.status == MembershipStatus.approved
            has_pending = req.status == MembershipStatus.pending

    approved_count = sum(1 for r in club.membership_requests if r.status == MembershipStatus.approved)

    return {
        **{c.name: getattr(club, c.name) for c in club.__table__.columns},
        "approval_status": club.approval_status.value if hasattr(club.approval_status, "value") else club.approval_status,
        "member_count": approved_count,
        "is_member":    is_member,
        "has_pending":  has_pending,
        "is_owner":     is_owner,
    }


@router.get("", response_model=ClubListResponse)
def list_clubs(
    page:     int            = Query(1, ge=1),
    category: Optional[str] = None,
    approval_status: Optional[str] = None,
    db:       Session        = Depends(get_db),
    current_user: User       = Depends(get_current_user),
):
    query = db.query(Club)
    if category:
        query = query.filter(Club.category == category)

    if current_user.role.value == "admin":
        # Admins can filter by approval status; default shows everything.
        if approval_status:
            query = query.filter(Club.approval_status == approval_status)
    else:
        # Students/lecturers see approved + pending clubs (so people can find
        # and join a club while it's still awaiting admin review), plus
        # their own rejected submissions so they can track them.
        query = query.filter(
            or_(
                Club.approval_status.in_(
                    [ClubApprovalStatus.approved, ClubApprovalStatus.pending]
                ),
                Club.created_by == current_user.id,
            )
        )

    total = query.count()
    clubs = (
        query.order_by(Club.name.asc())
        .offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
    )
    return {
        "data": [_club_out(c, current_user) for c in clubs],
        "total": total, "page": page,
        "pages": max(1, math.ceil(total / PAGE_SIZE)), "page_size": PAGE_SIZE,
    }


@router.get("/{club_id}", response_model=ClubOut)
def get_club(
    club_id: int,
    db:      Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return _club_out(club, current_user)


@router.post("", response_model=ClubOut, status_code=201)
def create_club(
    payload:      ClubCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    # ── Duplicate name check ───────────────────────────
    existing = db.query(Club).filter(
        func.lower(Club.name) == func.lower(payload.name.strip())
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"A club named '{payload.name}' is already registered. "
                   "Please use a different name or contact the existing club's organizers."
        )

    club = Club(**payload.model_dump(), created_by=current_user.id)
    db.add(club)
    db.flush()
    _log(db, "club.create", f"Created club: {club.name}", current_user)
    notify_admins(
        db, "club", "New club awaiting approval",
        f"{current_user.name} registered '{club.name}' for review.",
        user_id=current_user.id,
        link="/clubs",
    )
    db.commit()
    db.refresh(club)
    return _club_out(club, current_user)


# ── Approval workflow (admin approves/rejects club registration) ──

@router.patch("/{club_id}/approval")
def review_club(
    club_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Admin approves or rejects a club. payload: {action: 'approve'|'reject', reason?: str}"""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    action = payload.get("action")
    if action == "approve":
        club.approval_status  = ClubApprovalStatus.approved
        club.rejection_reason = None
        club.reviewed_by      = current_admin.id
        club.reviewed_at      = datetime.now(timezone.utc)
        _log(db, "club.approve", f"Approved club: {club.name}", current_admin)
        if club.created_by:
            notify_user(db, club.created_by, "club", "Club approved",
                        f"Your club '{club.name}' was approved and is now live.", link="/app/clubs")
    elif action == "reject":
        reason = (payload.get("reason") or "").strip()
        club.approval_status  = ClubApprovalStatus.rejected
        club.rejection_reason = reason or None
        club.reviewed_by      = current_admin.id
        club.reviewed_at      = datetime.now(timezone.utc)
        _log(db, "club.reject", f"Rejected club: {club.name}" + (f" — {reason}" if reason else ""), current_admin)
        if club.created_by:
            msg = f"Your club '{club.name}' was rejected."
            if reason:
                msg += f" Reason: {reason}"
            notify_user(db, club.created_by, "club", "Club rejected", msg, link="/app/clubs")
    else:
        raise HTTPException(status_code=422, detail="action must be 'approve' or 'reject'")

    db.commit()
    db.refresh(club)
    return _club_out(club, current_admin)


@router.post("/{club_id}/join")
def request_membership(
    club_id:      int,
    payload:      dict,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Submit a membership request (or cancel it / leave).
    payload for join: { course, year_of_study, full_name, phone_number }
    payload for leave/cancel: {} (if already member or pending)
    """
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    existing = db.query(ClubMembershipRequest).filter(
        and_(ClubMembershipRequest.club_id == club_id, ClubMembershipRequest.user_id == current_user.id)
    ).first()

    if existing:
        # Leave or cancel
        if existing.status == MembershipStatus.approved:
            # Remove from club_members too
            if current_user in club.members:
                club.members.remove(current_user)
        db.delete(existing)
        _log(db, "club.leave", f"{current_user.email} left/cancelled club: {club.name}", current_user)
        db.commit()
        member_count = sum(1 for r in club.membership_requests if r.status == MembershipStatus.approved)
        return {"action": "left", "member_count": member_count}
    else:
        # Validate required fields — admission number replaced by the
        # member's @cuea.edu email, which we already have from their account.
        required = ["course", "year_of_study", "full_name", "phone_number"]
        missing  = [f for f in required if not payload.get(f)]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Missing required fields: {', '.join(missing)}"
            )
        req = ClubMembershipRequest(
            club_id=club_id,
            user_id=current_user.id,
            course=str(payload["course"]),
            year_of_study=int(payload["year_of_study"]),
            full_name=str(payload["full_name"]),
            phone_number=str(payload["phone_number"]),
            status=MembershipStatus.pending,
        )
        db.add(req)
        _log(db, "club.join_request", f"{current_user.email} requested to join club: {club.name}", current_user)
        db.commit()
        member_count = sum(1 for r in club.membership_requests if r.status == MembershipStatus.approved)
        return {"action": "requested", "member_count": member_count}


@router.get("/{club_id}/members")
def get_club_members(
    club_id: int,
    db:      Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Club owner can see all membership requests."""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if club.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only the club owner can view members")

    requests = db.query(ClubMembershipRequest).filter(ClubMembershipRequest.club_id == club_id).all()
    return {
        "club_id":        club_id,
        "club_name":      club.name,
        "member_count":   sum(1 for r in requests if r.status == MembershipStatus.approved),
        "pending_count":  sum(1 for r in requests if r.status == MembershipStatus.pending),
        "requests": [
            {
                "id":               r.id,
                "user_id":          r.user_id,
                "user_name":        r.user.name if r.user else None,
                "user_email":       r.user.email if r.user else None,  # university email replaces admission number
                "course":           r.course,
                "year_of_study":    r.year_of_study,
                "full_name":        r.full_name,
                "phone_number":     r.phone_number,
                "status":           r.status,
                "created_at":       r.created_at,
            }
            for r in requests
        ],
    }


@router.patch("/{club_id}/members/{request_id}")
def approve_reject_membership(
    club_id:    int,
    request_id: int,
    payload:    dict,
    db:         Session = Depends(get_db),
    current_user: User  = Depends(get_current_user),
):
    """Club owner approves or rejects a membership request. payload: {action: 'approve'|'reject'}"""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if club.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only the club owner can manage memberships")

    req = db.query(ClubMembershipRequest).filter(
        and_(ClubMembershipRequest.id == request_id, ClubMembershipRequest.club_id == club_id)
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Membership request not found")

    action = payload.get("action")
    if action == "approve":
        req.status = MembershipStatus.approved
        if req.user and req.user not in club.members:
            club.members.append(req.user)
        _log(db, "club.approve_member", f"Approved {req.user.email if req.user else request_id} for {club.name}", current_user)
        if req.user_id:
            notify_user(db, req.user_id, "club",
                        "Club membership approved",
                        f"Your request to join '{club.name}' was approved.",
                        link="/app/clubs")
    elif action == "reject":
        req.status = MembershipStatus.rejected
        _log(db, "club.reject_member", f"Rejected {req.user.email if req.user else request_id} for {club.name}", current_user)
        if req.user_id:
            notify_user(db, req.user_id, "club",
                        "Club membership rejected",
                        f"Your request to join '{club.name}' was rejected.",
                        link="/app/clubs")
    else:
        raise HTTPException(status_code=422, detail="action must be 'approve' or 'reject'")

    db.commit()
    return {"action": action, "request_id": request_id, "status": req.status}


@router.delete("/{club_id}", status_code=204)
def delete_club(
    club_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if club.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorised")
    _log(db, "club.delete", f"Deleted club: {club.name}", current_user)
    db.delete(club)
    db.commit()
