from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import math

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User
from app.models.feedback import Feedback
from app.schemas.schemas import FeedbackCreate, FeedbackOut, FeedbackListResponse

router = APIRouter(prefix="/feedback", tags=["feedback"])
PAGE_SIZE = 20


@router.get("", response_model=FeedbackListResponse)
def list_feedback(page: int = Query(1, ge=1), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Feedback)
    # Students only see their own; admins see all
    if current_user.role != "admin":
        query = query.filter(Feedback.submitted_by == current_user.id)
    total = query.count()
    items = query.order_by(Feedback.created_at.desc()).offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
    return {"data": items, "total": total, "page": page, "pages": max(1, math.ceil(total / PAGE_SIZE)), "page_size": PAGE_SIZE}


@router.post("", response_model=FeedbackOut, status_code=201)
def submit_feedback(payload: FeedbackCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    submitted_by = None if payload.is_anonymous else current_user.id
    item = Feedback(**payload.model_dump(), submitted_by=submitted_by)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{feedback_id}/status", status_code=200)
def update_status(feedback_id: int, status: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    item = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Feedback not found")
    item.status = status
    db.commit()
    return {"message": "Status updated"}
