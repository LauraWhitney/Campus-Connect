from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User
from app.models.marketplace import MarketplaceItem
from app.models.activity_log import ActivityLog
from app.schemas.schemas import (
    MarketplaceItemCreate, MarketplaceItemOut, MarketplaceListResponse
)

router = APIRouter(prefix="/marketplace", tags=["marketplace"])
PAGE_SIZE = 12


def _log(db: Session, action: str, detail: str, user: User):
    db.add(ActivityLog(
        user_id=user.id, user_email=user.email,
        action=action, detail=detail[:500],
    ))


@router.get("", response_model=MarketplaceListResponse)
def list_items(
    page:     int            = Query(1, ge=1),
    category: Optional[str] = None,
    sold:     Optional[bool] = None,
    db:       Session        = Depends(get_db),
    _:        User           = Depends(get_current_user),
):
    query = db.query(MarketplaceItem)
    if category:
        query = query.filter(MarketplaceItem.category == category)
    if sold is not None:
        query = query.filter(MarketplaceItem.is_sold == sold)
    total = query.count()
    items = (
        query.order_by(MarketplaceItem.created_at.desc())
        .offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
    )
    return {
        "data": items, "total": total, "page": page,
        "pages": max(1, math.ceil(total / PAGE_SIZE)), "page_size": PAGE_SIZE,
    }


@router.get("/{item_id}", response_model=MarketplaceItemOut)
def get_item(item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("", response_model=MarketplaceItemOut, status_code=201)
def create_item(
    payload:      MarketplaceItemCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    item = MarketplaceItem(**payload.model_dump(), seller_id=current_user.id)
    db.add(item)
    db.flush()
    _log(db, "marketplace.list", f"Listed item for sale: {item.title} @ KES {item.price}", current_user)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}/sold", response_model=MarketplaceItemOut)
def mark_sold(
    item_id:      int,
    payload:      dict,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Mark an item as sold and record the buyer.
    Body: { "buyer_id": <int> }  — optional; omit to mark sold without a recorded buyer.
    Only the seller or an admin may call this.
    """
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.seller_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only the seller can mark an item as sold")
    if item.is_sold:
        raise HTTPException(status_code=400, detail="Item is already marked as sold")

    buyer_id = payload.get("buyer_id")
    if buyer_id:
        buyer = db.query(User).filter(User.id == buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer user not found")
        item.buyer_id = buyer_id

    item.is_sold  = True
    item.sold_at  = datetime.now(timezone.utc)

    buyer_info = f" to user ID {buyer_id}" if buyer_id else ""
    _log(db, "marketplace.sold",
         f"Marked '{item.title}' as SOLD{buyer_info}", current_user)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}/unsold", response_model=MarketplaceItemOut)
def unmark_sold(
    item_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Reverse a sold marking (seller or admin only)."""
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.seller_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorised")
    item.is_sold  = False
    item.buyer_id = None
    item.sold_at  = None
    _log(db, "marketplace.unmark_sold", f"Un-marked '{item.title}' as sold", current_user)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.seller_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorised")
    _log(db, "marketplace.delete", f"Deleted listing: {item.title}", current_user)
    db.delete(item)
    db.commit()
