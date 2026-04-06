from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import math

from app.core.database import get_db
from app.core.security import require_admin
from app.models.activity_log import ActivityLog

router = APIRouter(prefix="/admin/activity", tags=["admin"])
PAGE_SIZE = 30


@router.get("")
def get_activity_logs(
    page: int = Query(1, ge=1),
    action: str = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    query = db.query(ActivityLog)
    if action:
        query = query.filter(ActivityLog.action == action)

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