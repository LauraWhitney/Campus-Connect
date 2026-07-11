from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
import math

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User
from app.models.notification import Notification, NotificationAudience

router = APIRouter(prefix="/notifications", tags=["notifications"])
PAGE_SIZE = 20


def _out(n: Notification) -> dict:
    return {
        "id":         n.id,
        "audience":   n.audience.value if hasattr(n.audience, "value") else n.audience,
        "type":       n.type.value if hasattr(n.type, "value") else n.type,
        "title":      n.title,
        "message":    n.message,
        "link":       n.link,
        "is_read":    n.is_read,
        "created_at": n.created_at,
    }


# ── Student / general user notifications ───────────────
# Returns notifications addressed directly to the current user.
@router.get("")
def list_my_notifications(
    page: int = 1,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)  # noqa: E712

    total = query.count()
    items = (
        query.order_by(Notification.created_at.desc())
        .offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
    )
    unread_count = (
        db.query(func.count(Notification.id))
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)  # noqa: E712
        .scalar()
    )
    return {
        "data": [_out(n) for n in items],
        "total": total,
        "page": page,
        "pages": max(1, math.ceil(total / PAGE_SIZE)),
        "unread_count": unread_count,
    }


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = (
        db.query(func.count(Notification.id))
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)  # noqa: E712
        .scalar()
    )
    return {"unread_count": count}


@router.patch("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    if n.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised")
    n.is_read = True
    db.commit()
    return _out(n)


@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False  # noqa: E712
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


# ── Admin notifications ─────────────────────────────────
# Admin notifications are broadcast (audience == admin, user_id is null),
# so every admin sees the same feed and any admin marking one read clears it
# for all admins (mirrors a shared inbox, which is what "Admin Notifications"
# means for a small ops team).
admin_router = APIRouter(prefix="/admin/notifications", tags=["admin"])


@admin_router.get("")
def list_admin_notifications(
    page: int = 1,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    query = db.query(Notification).filter(Notification.audience == NotificationAudience.admin)
    if unread_only:
        query = query.filter(Notification.is_read == False)  # noqa: E712

    total = query.count()
    items = (
        query.order_by(Notification.created_at.desc())
        .offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
    )
    unread_count = (
        db.query(func.count(Notification.id))
        .filter(Notification.audience == NotificationAudience.admin, Notification.is_read == False)  # noqa: E712
        .scalar()
    )
    return {
        "data": [_out(n) for n in items],
        "total": total,
        "page": page,
        "pages": max(1, math.ceil(total / PAGE_SIZE)),
        "unread_count": unread_count,
    }


@admin_router.get("/unread-count")
def admin_unread_count(db: Session = Depends(get_db), _=Depends(require_admin)):
    count = (
        db.query(func.count(Notification.id))
        .filter(Notification.audience == NotificationAudience.admin, Notification.is_read == False)  # noqa: E712
        .scalar()
    )
    return {"unread_count": count}


@admin_router.patch("/{notification_id}/read")
def admin_mark_read(notification_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    n = db.query(Notification).filter(
        Notification.id == notification_id, Notification.audience == NotificationAudience.admin
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return _out(n)


@admin_router.patch("/read-all")
def admin_mark_all_read(db: Session = Depends(get_db), _=Depends(require_admin)):
    db.query(Notification).filter(
        Notification.audience == NotificationAudience.admin, Notification.is_read == False  # noqa: E712
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
