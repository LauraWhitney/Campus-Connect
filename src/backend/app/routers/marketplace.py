from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.marketplace import MarketplaceItem
from app.schemas.schemas import MarketplaceItemCreate, MarketplaceItemOut, MarketplaceListResponse

router = APIRouter(prefix="/marketplace", tags=["marketplace"])
PAGE_SIZE = 12


@router.get("", response_model=MarketplaceListResponse)
def list_items(
    page: int = Query(1, ge=1),
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(MarketplaceItem).filter(MarketplaceItem.is_sold == False)
    if category:
        query = query.filter(MarketplaceItem.category == category)

    total = query.count()
    items = query.order_by(MarketplaceItem.created_at.desc()).offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()

    return {"data": items, "total": total, "page": page, "pages": max(1, math.ceil(total / PAGE_SIZE)), "page_size": PAGE_SIZE}


@router.get("/{item_id}", response_model=MarketplaceItemOut)
def get_item(item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("", response_model=MarketplaceItemOut, status_code=201)
def create_item(
    payload: MarketplaceItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = MarketplaceItem(**payload.model_dump(), seller_id=current_user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}/sold", status_code=200)
def mark_sold(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.seller_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorised")
    item.is_sold = True
    db.commit()
    return {"message": "Marked as sold"}


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.seller_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorised")
    db.delete(item)
    db.commit()
