from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
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


@router.get("", response_model=FeedbackListResponse)
def list_feedback(
    page:     int            = Query(1, ge=1),
    status:   Optional[str] = None,
    category: Optional[str] = None,
    db:       Session        = Depends(get_db),
    current_user: User       = Depends(get_current_user),
):
    query = db.query(Feedback)
    # Non-admins only see their own feedback
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
        "data": items, "total": total, "page": page,
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
    return fb


@router.post("", response_model=FeedbackOut, status_code=201)
def submit_feedback(
    payload:      FeedbackCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    fb = Feedback(
        **payload.model_dump(),
        submitted_by=current_user.id if not payload.is_anonymous else None,
    )
    db.add(fb)
    db.flush()
    identity = "anonymously" if payload.is_anonymous else current_user.email
    _log(db, "feedback.submit",
         f"{identity} submitted feedback: '{fb.title}' [{fb.category}]", current_user)
    db.commit()
    db.refresh(fb)
    return fb


@router.patch("/{feedback_id}/status", response_model=FeedbackOut)
def update_status(
    feedback_id:  int,
    payload:      dict,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin),
):
    """
    Admin updates feedback status.
    Records WHO resolved it, WHEN, and marks notified=True so the submitter
    knows their feedback was acted on.
    """
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")

    new_status = payload.get("status")
    if new_status not in [s.value for s in FeedbackStatus]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    old_status   = fb.status.value if hasattr(fb.status, "value") else str(fb.status)
    fb.status    = new_status
    fb.notified  = True                               # ← flag submitter for notification

    if new_status == FeedbackStatus.Resolved.value:
        fb.resolved_by  = current_user.id
        fb.resolved_at  = datetime.now(timezone.utc)

    _log(db, "feedback.status_update",
         f"Admin {current_user.email} changed feedback #{feedback_id} "
         f"'{fb.title}' from {old_status} → {new_status}", current_user)
    db.commit()
    db.refresh(fb)
    return fb


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
