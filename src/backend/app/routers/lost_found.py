from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.lost_found import LostFoundItem
from app.schemas.schemas import LostFoundCreate, LostFoundOut, LostFoundListResponse

router = APIRouter(prefix="/lost-found", tags=["lost-found"])
PAGE_SIZE = 12


@router.get("", response_model=LostFoundListResponse)
def list_items(
    page: int = Query(1, ge=1),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(LostFoundItem).filter(LostFoundItem.is_claimed == False)
    if status:
        query = query.filter(LostFoundItem.status == status)
    total = query.count()
    items = query.order_by(LostFoundItem.created_at.desc()).offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
    return {"data": items, "total": total, "page": page, "pages": max(1, math.ceil(total / PAGE_SIZE)), "page_size": PAGE_SIZE}


@router.post("", response_model=LostFoundOut, status_code=201)
def report_item(payload: LostFoundCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = LostFoundItem(**payload.model_dump(), reported_by=current_user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}/claimed", status_code=200)
def mark_claimed(item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_claimed = True
    item.status = "Claimed"
    db.commit()
    return {"message": "Item marked as claimed"}
