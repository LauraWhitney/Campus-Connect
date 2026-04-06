from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User, UserRole
from app.models.event import Event
from app.models.marketplace import MarketplaceItem
from app.models.club import Club
from app.models.lost_found import LostFoundItem
from app.models.feedback import Feedback, FeedbackStatus
from app.schemas.schemas import UserOut
import math

router = APIRouter(prefix="/admin", tags=["admin"])
PAGE_SIZE = 20


# ── Platform stats ─────────────────────────────────────
@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    recent_users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(8)
        .all()
    )

    pending_fb = (
        db.query(func.count(Feedback.id))
        .filter(Feedback.status == FeedbackStatus.Pending)
        .scalar()
    )

    return {
        "total_users":             db.query(func.count(User.id)).scalar(),
        "total_events":            db.query(func.count(Event.id)).scalar(),
        "total_marketplace_items": db.query(func.count(MarketplaceItem.id)).scalar(),
        "total_clubs":             db.query(func.count(Club.id)).scalar(),
        "total_lost_found":        db.query(func.count(LostFoundItem.id)).filter(LostFoundItem.is_claimed == False).scalar(),
        "total_feedback":          db.query(func.count(Feedback.id)).scalar(),
        "pending_feedback":        pending_fb,
        "recent_users":            recent_users,
    }


# ── User management ────────────────────────────────────
@router.get("/users")
def list_users(page: int = 1, db: Session = Depends(get_db), _=Depends(require_admin)):
    total = db.query(func.count(User.id)).scalar()
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .offset((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .all()
    )
    return {
        "data": users,
        "total": total,
        "page": page,
        "pages": max(1, math.ceil(total / PAGE_SIZE)),
        "page_size": PAGE_SIZE,
    }


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = payload.get("role")
    if new_role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user.role = new_role
    db.commit()
    return {"message": "Role updated", "user": user}


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

# ── Seed first admin (disabled once any admin exists) ─
@router.post("/seed-admin", status_code=201)
def seed_admin(payload: dict, db: Session = Depends(get_db)):
    """Create the very first admin account. Auto-disables once one admin exists."""
    from app.core.security import hash_password

    existing_admin = db.query(User).filter(User.role == UserRole.admin).first()
    if existing_admin:
        raise HTTPException(
            status_code=403,
            detail="An admin account already exists. Use the admin panel to manage roles.",
        )

    email    = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    name     = payload.get("name", "Admin").strip()

    if not email or not password:
        raise HTTPException(status_code=422, detail="Email and password are required")
    if len(password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    admin = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role=UserRole.admin,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return {"message": f"Admin account created for {email}. You can now log in at http://localhost:5174"}