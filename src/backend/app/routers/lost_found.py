from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User
from app.models.lost_found import LostFoundItem, ItemStatus
from app.models.activity_log import ActivityLog
from app.schemas.schemas import LostFoundCreate, LostFoundOut, LostFoundListResponse

router = APIRouter(prefix="/lost-found", tags=["lost-found"])
PAGE_SIZE = 12


def _log(db: Session, action: str, detail: str, user: User):
    db.add(ActivityLog(
        user_id=user.id, user_email=user.email,
        action=action, detail=detail[:500],
    ))


@router.get("", response_model=LostFoundListResponse)
def list_items(
    page:   int            = Query(1, ge=1),
    status: Optional[str] = None,
    db:     Session        = Depends(get_db),
    _:      User           = Depends(get_current_user),
):
    query = db.query(LostFoundItem)
    if status:
        query = query.filter(LostFoundItem.status == status)
    total = query.count()
    items = (
        query.order_by(LostFoundItem.created_at.desc())
        .offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
    )
    return {
        "data": items, "total": total, "page": page,
        "pages": max(1, math.ceil(total / PAGE_SIZE)), "page_size": PAGE_SIZE,
    }


@router.get("/{item_id}", response_model=LostFoundOut)
def get_item(
    item_id: int,
    db:      Session = Depends(get_db),
    _:       User    = Depends(get_current_user),
):
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("", response_model=LostFoundOut, status_code=201)
def report_item(
    payload:      LostFoundCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    item = LostFoundItem(**payload.model_dump(), reported_by=current_user.id)
    db.add(item)
    db.flush()
    verb = "reported lost" if item.status == ItemStatus.Lost else "reported found"
    _log(db, "lostfound.report",
         f"{current_user.email} {verb} item: '{item.title}'", current_user)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}/claim", response_model=LostFoundOut)
def claim_item(
    item_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Mark a lost/found item as claimed.
    Records WHO claimed it and WHEN, and updates status to 'Claimed'.
    """
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.is_claimed:
        raise HTTPException(status_code=400, detail="Item has already been claimed")

    item.is_claimed  = True
    item.claimed_by  = current_user.id
    item.claimed_at  = datetime.now(timezone.utc)
    item.status      = ItemStatus.Claimed          # ← status updated to Claimed

    _log(db, "lostfound.claim",
         f"{current_user.email} claimed item: '{item.title}' (id={item_id})", current_user)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}/found", response_model=LostFoundOut)
def mark_found(
    item_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Update a 'Lost' item to 'Found' status when someone locates it.
    Only the reporter or an admin may do this.
    """
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.reported_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorised")
    if item.status == ItemStatus.Claimed:
        raise HTTPException(status_code=400, detail="Item is already claimed")

    item.status = ItemStatus.Found
    _log(db, "lostfound.found",
         f"{current_user.email} marked item as found: '{item.title}'", current_user)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.reported_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorised")
    _log(db, "lostfound.delete",
         f"{current_user.email} removed lost/found report: '{item.title}'", current_user)
    db.delete(item)
    db.commit()
