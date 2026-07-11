from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.core.notify import notify_user
from app.models.user import User
from app.models.feedback import Feedback, FeedbackStatus
from app.models.activity_log import ActivityLog
from app.schemas.schemas import FeedbackCreate, FeedbackOut, FeedbackListResponse

router = APIRouter(prefix="/feedback", tags=["feedback"])
PAGE_SIZE = 12


def _log(db: Session, action: str, detail: str, user: User):
    db.add(ActivityLog(
        user_id=user.id, user_email=user.email,
        action=action, detail=detail[:500],
    ))


def _fb_out(fb: Feedback) -> dict:
    submitter = None
    if fb.submitter and not fb.is_anonymous:
        submitter = {"id": fb.submitter.id, "name": fb.submitter.name}
    # Normalise enum fields to plain strings so JSON serialises correctly
    data = {}
    for col in fb.__table__.columns:
        val = getattr(fb, col.name)
        data[col.name] = val.value if hasattr(val, "value") else val
    return {
        **data,
        "submitted_by": submitter,
        "submitter": submitter,
    }


@router.get("", response_model=FeedbackListResponse)
def list_feedback(
    page:     int            = Query(1, ge=1),
    status:   Optional[str] = None,
    category: Optional[str] = None,
    db:       Session        = Depends(get_db),
    current_user: User       = Depends(get_current_user),
):
    query = db.query(Feedback)
    if current_user.role.value != "admin":
        query = query.filter(Feedback.submitted_by == current_user.id)
    if status:
        query = query.filter(Feedback.status == status)
    if category:
        query = query.filter(Feedback.category == category)

    total = query.count()
    items = (
        query.order_by(Feedback.created_at.desc())
        .offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
    )
    return {
        "data": [_fb_out(fb) for fb in items], "total": total, "page": page,
        "pages": max(1, math.ceil(total / PAGE_SIZE)), "page_size": PAGE_SIZE,
    }


@router.get("/{feedback_id}", response_model=FeedbackOut)
def get_feedback(
    feedback_id:  int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if current_user.role.value != "admin" and fb.submitted_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised")
    return _fb_out(fb)


@router.post("", response_model=FeedbackOut, status_code=201)
def submit_feedback(
    payload:      FeedbackCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    fb = Feedback(
        title        = payload.title,
        description  = payload.description,
        category     = payload.category,
        department   = payload.department,
        is_anonymous = payload.is_anonymous,
        submitted_by = current_user.id if not payload.is_anonymous else None,
    )
    db.add(fb)
    db.flush()
    identity = "anonymously" if payload.is_anonymous else current_user.email
    _log(db, "feedback.submit",
         f"{identity} submitted feedback: '{fb.title}' [{fb.category}]", current_user)
    db.commit()
    db.refresh(fb)
    return _fb_out(fb)


@router.patch("/{feedback_id}/status", response_model=FeedbackOut)
def update_status(
    feedback_id:  int,
    payload:      dict,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin),
):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")

    new_status = payload.get("status")
    valid = [s.value for s in FeedbackStatus]
    if new_status not in valid:
        raise HTTPException(status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid)}")

    old_status = fb.status.value if hasattr(fb.status, "value") else str(fb.status)
    fb.status   = new_status
    fb.notified = True

    if new_status == FeedbackStatus.Resolved.value:
        fb.resolved_by = current_user.id
        fb.resolved_at = datetime.now(timezone.utc)

    _log(db, "feedback.status_update",
         f"Admin {current_user.email} changed feedback #{feedback_id} "
         f"'{fb.title}' from {old_status} → {new_status}", current_user)

    # ── Notify the submitter (unless they submitted anonymously) ──
    if fb.submitted_by:
        STATUS_COPY = {
            "Reviewed": "has been reviewed by the administration",
            "Resolved": "has been marked as resolved",
            "Pending":  "status was reset to pending",
        }
        detail = STATUS_COPY.get(new_status, f"was updated to {new_status}")
        notify_user(
            db,
            user_id=fb.submitted_by,
            type_="feedback",
            title=f"Feedback {new_status.lower()}",
            message=f"Your feedback '{fb.title}' {detail}.",
            link="/app/feedback",
        )

    db.commit()
    db.refresh(fb)
    return _fb_out(fb)


@router.delete("/{feedback_id}", status_code=204)
def delete_feedback(
    feedback_id:  int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin),
):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    _log(db, "feedback.delete",
         f"Admin {current_user.email} deleted feedback: '{fb.title}'", current_user)
    db.delete(fb)
    db.commit()