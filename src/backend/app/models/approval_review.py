from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ApprovalReview(Base):
    """Structured history of every approve/reject decision on a club or event,
    so admins can see the full back-and-forth, not just the latest status."""
    __tablename__ = "approval_reviews"

    id              = Column(Integer, primary_key=True, index=True)
    entity_type     = Column(String(10), nullable=False)   # 'club' | 'event'
    entity_id       = Column(Integer, nullable=False)
    action          = Column(String(10), nullable=False)   # 'approve' | 'reject'
    previous_status = Column(String(20), nullable=False)
    new_status      = Column(String(20), nullable=False)
    reason          = Column(String(500), nullable=True)
    reviewed_by     = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at     = Column(DateTime(timezone=True), server_default=func.now())

    reviewer = relationship("User", foreign_keys=[reviewed_by])
