from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import not_
import math

from app.core.database import get_db
from app.core.security import require_admin
from app.models.activity_log import ActivityLog

router = APIRouter(prefix="/admin/activity", tags=["admin"])
PAGE_SIZE = 30

# Every module a "system" action can belong to (everything that isn't an
# account/auth action) — used to break the summary down by module.
SYSTEM_MODULES = ["event", "club", "marketplace", "lostfound", "feedback", "admin", "role"]


@router.get("/summary")
def get_activity_summary(
    db: Session = Depends(get_db),
    _ = Depends(require_admin),
):
    total    = db.query(ActivityLog).count()
    accounts = db.query(ActivityLog).filter(ActivityLog.action.like("user.%")).count()
    by_module = {
        module: db.query(ActivityLog).filter(ActivityLog.action.like(f"{module}.%")).count()
        for module in SYSTEM_MODULES
    }
    return {
        "total": total,
        "accounts": accounts,
        "system": total - accounts,
        "by_module": by_module,
    }


@router.get("")
def get_activity_logs(
    page:     int            = Query(1, ge=1),
    action:   str            = None,          # prefix or exact, e.g. "event" or "event.rsvp_add"
    category: str            = None,          # "accounts" | "system"
    db:       Session        = Depends(get_db),
    _                        = Depends(require_admin),
):
    query = db.query(ActivityLog)
    if category == "accounts":
        query = query.filter(ActivityLog.action.like("user.%"))
    elif category == "system":
        query = query.filter(not_(ActivityLog.action.like("user.%")))
    if action:
        # Support both exact match ("event.rsvp_add") and prefix match ("event")
        if "." in action:
            query = query.filter(ActivityLog.action == action)
        else:
            query = query.filter(ActivityLog.action.like(f"{action}.%"))

    total = query.count()
    logs  = (
        query
        .order_by(ActivityLog.created_at.desc())
        .offset((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .all()
    )

    return {
        "data": [
            {
                "id":         l.id,
                "user_id":    l.user_id,
                "user_email": l.user_email,
                "action":     l.action,
                "detail":     l.detail,
                "ip_address": l.ip_address,
                "created_at": l.created_at,
            }
            for l in logs
        ],
        "total": total,
        "page":  page,
        "pages": max(1, math.ceil(total / PAGE_SIZE)),
    }
