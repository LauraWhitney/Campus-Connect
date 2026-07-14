from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
import math
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.core.notify import notify_user, notify_admins
from app.models.user import User
from app.models.event import Event, EventAttendance, EventRSVP, RSVPStatus, EventApprovalStatus
from app.models.activity_log import ActivityLog
from app.schemas.schemas import EventCreate, EventOut, EventListResponse, AttendanceOut

router = APIRouter(prefix="/events", tags=["events"])
PAGE_SIZE = 12


def _log(db: Session, action: str, detail: str, user: User):
    db.add(ActivityLog(
        user_id=user.id, user_email=user.email,
        action=action, detail=detail[:500],
    ))


def _event_out(event: Event, current_user: Optional[User]) -> dict:
    # Check if user has an approved RSVP request
    has_rsvped = False
    pending_rsvp = False
    if current_user:
        rsvp_req = next(
            (r for r in event.rsvp_requests if r.user_id == current_user.id),
            None
        )
        if rsvp_req:
            has_rsvped = rsvp_req.status == RSVPStatus.approved
            pending_rsvp = rsvp_req.status == RSVPStatus.pending

    approved_count = sum(1 for r in event.rsvp_requests if r.status == RSVPStatus.approved)
    pending_count  = sum(1 for r in event.rsvp_requests if r.status == RSVPStatus.pending)

    is_creator = current_user and event.created_by == current_user.id

    return {
        **{c.name: getattr(event, c.name) for c in event.__table__.columns},
        "approval_status": event.approval_status.value if hasattr(event.approval_status, "value") else event.approval_status,
        "rsvp_count":    approved_count,
        "pending_rsvp_count": pending_count,
        "has_rsvped":    has_rsvped,
        "pending_rsvp":  pending_rsvp,
        "is_creator":    is_creator,
        "creator_name":  event.creator.name if event.creator else None,
    }


@router.get("", response_model=EventListResponse)
def list_events(
    page: int = Query(1, ge=1),
    category: Optional[str] = None,
    approval_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Event)
    if category:
        query = query.filter(Event.category == category)

    if current_user.role.value == "admin":
        # Admins can filter by approval status; default shows everything.
        if approval_status:
            query = query.filter(Event.approval_status == approval_status)
    else:
        # Students/lecturers see only approved events, plus their own
        # pending/rejected submissions so they can track and resubmit them.
        # An event stays hidden from everyone else until an admin approves it.
        query = query.filter(
            or_(
                Event.approval_status == EventApprovalStatus.approved,
                Event.created_by == current_user.id,
            )
        )

    total  = query.count()
    events = query.order_by(Event.date.asc()).offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
    return {
        "data":      [_event_out(e, current_user) for e in events],
        "total":     total, "page": page,
        "pages":     max(1, math.ceil(total / PAGE_SIZE)),
        "page_size": PAGE_SIZE,
    }


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    is_visible = (
        event.approval_status == EventApprovalStatus.approved
        or event.created_by == current_user.id
        or current_user.role.value == "admin"
    )
    if not is_visible:
        raise HTTPException(status_code=404, detail="Event not found")
    return _event_out(event, current_user)


@router.post("", response_model=EventOut, status_code=201)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ── Venue + time conflict check ────────────────────
    conflict = db.query(Event).filter(
        and_(
            Event.venue == payload.venue.strip(),
            Event.date  == payload.date,
            Event.time  == payload.time,
        )
    ).first()
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=(
                f"The venue '{payload.venue}' is already booked on {payload.date} "
                f"at {payload.time}. Please choose a different time or location."
            )
        )

    event = Event(**payload.model_dump(), created_by=current_user.id)
    db.add(event)
    db.flush()
    _log(db, "event.create", f"Created event: {event.title}", current_user)
    notify_admins(
        db, "event", "New event awaiting approval",
        f"{current_user.name} submitted '{event.title}' for review.",
        user_id=current_user.id,
        link="/events",
    )
    db.commit()
    db.refresh(event)
    return _event_out(event, current_user)


# ── Approval workflow (admin approves/rejects; owner edits + resubmits) ──

@router.patch("/{event_id}/approval")
def review_event(
    event_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Admin approves or rejects an event. payload: {action: 'approve'|'reject', reason?: str}"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    action = payload.get("action")
    if action == "approve":
        event.approval_status  = EventApprovalStatus.approved
        event.rejection_reason = None
        event.reviewed_by      = current_admin.id
        event.reviewed_at      = datetime.now(timezone.utc)
        _log(db, "event.approve", f"Approved event: {event.title}", current_admin)
        if event.created_by:
            notify_user(db, event.created_by, "event", "Event approved",
                        f"Your event '{event.title}' was approved and is now live.", link="/app/events")
    elif action == "reject":
        reason = (payload.get("reason") or "").strip()
        event.approval_status  = EventApprovalStatus.rejected
        event.rejection_reason = reason or None
        event.reviewed_by      = current_admin.id
        event.reviewed_at      = datetime.now(timezone.utc)
        _log(db, "event.reject", f"Rejected event: {event.title}" + (f" — {reason}" if reason else ""), current_admin)
        if event.created_by:
            msg = f"Your event '{event.title}' was rejected."
            if reason:
                msg += f" Reason: {reason}"
            msg += " You can edit and resubmit it."
            notify_user(db, event.created_by, "event", "Event rejected", msg, link="/app/events")
    else:
        raise HTTPException(status_code=422, detail="action must be 'approve' or 'reject'")

    db.commit()
    db.refresh(event)
    return _event_out(event, current_admin)


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Owner edits their event. If it had been rejected, editing automatically
    resubmits it for admin review (approval_status → pending), preserving the
    review history (reviewed_by/reviewed_at are cleared, but the prior
    rejection reason stays visible in the activity log).
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only the event creator can edit this event")

    was_rejected = event.approval_status == EventApprovalStatus.rejected

    for field, value in payload.model_dump().items():
        setattr(event, field, value)

    if was_rejected:
        event.approval_status  = EventApprovalStatus.pending
        event.rejection_reason = None
        event.reviewed_by      = None
        event.reviewed_at      = None
        _log(db, "event.resubmit", f"Resubmitted event for review: {event.title}", current_user)
        notify_admins(db, "event", "Event resubmitted for approval",
                      f"{current_user.name} edited and resubmitted '{event.title}'.",
                      user_id=current_user.id, link="/events")
    else:
        _log(db, "event.update", f"Updated event: {event.title}", current_user)

    db.commit()
    db.refresh(event)
    return _event_out(event, current_user)


# ── RSVP request (student submits, creator approves) ──

@router.post("/{event_id}/rsvp")
def request_rsvp(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle RSVP: if no request exists → create pending. If approved → cancel (undo). If pending → cancel."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing = db.query(EventRSVP).filter(
        and_(EventRSVP.event_id == event_id, EventRSVP.user_id == current_user.id)
    ).first()

    if existing:
        # Undo RSVP (cancel pending or approved)
        if existing.status == RSVPStatus.approved:
            # Remove from legacy rsvps table too
            if current_user in event.rsvps:
                event.rsvps.remove(current_user)
        db.delete(existing)
        _log(db, "event.rsvp_cancel", f"{current_user.email} cancelled RSVP for: {event.title}", current_user)
        db.commit()
        approved_count = sum(1 for r in event.rsvp_requests if r.status == RSVPStatus.approved)
        return {"action": "cancelled", "rsvp_count": approved_count}
    else:
        if event.approval_status != EventApprovalStatus.approved:
            raise HTTPException(
                status_code=400,
                detail="This event is awaiting admin approval and can't accept RSVPs yet."
            )
        # Check capacity
        approved_count = sum(1 for r in event.rsvp_requests if r.status == RSVPStatus.approved)
        if event.capacity and approved_count >= event.capacity:
            raise HTTPException(status_code=400, detail="Event is at full capacity")
        req = EventRSVP(event_id=event_id, user_id=current_user.id, status=RSVPStatus.pending)
        db.add(req)
        _log(db, "event.rsvp_request", f"{current_user.email} requested RSVP for: {event.title}", current_user)
        db.commit()
        return {"action": "requested", "rsvp_count": approved_count}


@router.get("/{event_id}/rsvps")
def get_event_rsvps(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creator can see all RSVP requests for their event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only the event creator can view RSVPs")

    requests = db.query(EventRSVP).filter(EventRSVP.event_id == event_id).all()
    return {
        "event_id":    event_id,
        "event_title": event.title,
        "requests": [
            {
                "id":       r.id,
                "user_id":  r.user_id,
                "user_name": r.user.name if r.user else None,
                "user_email": r.user.email if r.user else None,
                "status":   r.status,
                "created_at": r.created_at,
            }
            for r in requests
        ],
        "approved_count": sum(1 for r in requests if r.status == RSVPStatus.approved),
        "pending_count":  sum(1 for r in requests if r.status == RSVPStatus.pending),
    }


@router.patch("/{event_id}/rsvps/{rsvp_id}")
def approve_reject_rsvp(
    event_id: int,
    rsvp_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creator approves or rejects an RSVP request. payload: {action: 'approve'|'reject'}"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only the event creator can manage RSVPs")

    rsvp_req = db.query(EventRSVP).filter(
        and_(EventRSVP.id == rsvp_id, EventRSVP.event_id == event_id)
    ).first()
    if not rsvp_req:
        raise HTTPException(status_code=404, detail="RSVP request not found")

    action = payload.get("action")
    if action == "approve":
        # Check capacity
        approved_count = sum(1 for r in event.rsvp_requests if r.status == RSVPStatus.approved)
        if event.capacity and approved_count >= event.capacity:
            raise HTTPException(status_code=400, detail="Event is at full capacity")
        rsvp_req.status = RSVPStatus.approved
        # Also add to legacy event_rsvps
        if rsvp_req.user and rsvp_req.user not in event.rsvps:
            event.rsvps.append(rsvp_req.user)
        _log(db, "event.rsvp_approve", f"Approved RSVP for {rsvp_req.user.email if rsvp_req.user else rsvp_id}", current_user)
    elif action == "reject":
        rsvp_req.status = RSVPStatus.rejected
        _log(db, "event.rsvp_reject", f"Rejected RSVP for {rsvp_req.user.email if rsvp_req.user else rsvp_id}", current_user)
    else:
        raise HTTPException(status_code=422, detail="action must be 'approve' or 'reject'")

    db.commit()
    return {"action": action, "rsvp_id": rsvp_id, "status": rsvp_req.status}


# ── Attendance check-in ────────────────────────────────

@router.post("/{event_id}/checkin", response_model=AttendanceOut)
def check_in(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    approved = db.query(EventRSVP).filter(
        and_(EventRSVP.event_id == event_id, EventRSVP.user_id == current_user.id,
             EventRSVP.status == RSVPStatus.approved)
    ).first()
    if not approved:
        raise HTTPException(status_code=400, detail="You must have an approved RSVP to check in")

    existing = db.query(EventAttendance).filter(
        and_(EventAttendance.event_id == event_id, EventAttendance.user_id == current_user.id)
    ).first()

    if existing:
        if existing.checked_in:
            raise HTTPException(status_code=400, detail="Already checked in to this event")
        existing.checked_in    = True
        existing.checked_in_at = datetime.now(timezone.utc)
        record = existing
    else:
        record = EventAttendance(
            event_id=event_id, user_id=current_user.id,
            checked_in=True, checked_in_at=datetime.now(timezone.utc),
        )
        db.add(record)

    _log(db, "event.checkin", f"{current_user.email} checked in to: {event.title}", current_user)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{event_id}/attendance")
def get_attendance(
    event_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    records  = db.query(EventAttendance).filter(EventAttendance.event_id == event_id).all()
    approved = sum(1 for r in event.rsvp_requests if r.status == RSVPStatus.approved)
    return {
        "event_id":         event_id,
        "event_title":      event.title,
        "rsvp_count":       approved,
        "checked_in_count": sum(1 for r in records if r.checked_in),
        "records":          records,
    }


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only the event creator can delete this event")
    _log(db, "event.delete", f"Deleted event: {event.title}", current_user)
    db.delete(event)
    db.commit()