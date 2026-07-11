from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Enum as PgEnum, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class NotificationAudience(str, enum.Enum):
    user  = "user"   # targeted at a single user (user_id set)
    admin = "admin"  # visible to every admin account


class NotificationType(str, enum.Enum):
    feedback = "feedback"
    event    = "event"
    club     = "club"
    lostfound = "lostfound"
    contact  = "contact"
    system   = "system"


class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    # ── Targeting ───────────────────────────────────────
    audience   = Column(PgEnum(NotificationAudience), default=NotificationAudience.user, nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # null when audience == admin

    # ── Content ─────────────────────────────────────────
    type       = Column(PgEnum(NotificationType), default=NotificationType.system, nullable=False)
    title      = Column(String(200), nullable=False)
    message    = Column(String(500), nullable=False)
    link       = Column(String(300), nullable=True)  # optional deep-link, e.g. "/app/feedback"

    # ── State ───────────────────────────────────────────
    is_read    = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
