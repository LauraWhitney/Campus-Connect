from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Enum as PgEnum, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class FeedbackCategory(str, enum.Enum):
    Academic = "Academic"
    Facilities = "Facilities"
    Administration = "Administration"
    Clubs = "Clubs"
    Events = "Events"
    Other = "Other"


class FeedbackStatus(str, enum.Enum):
    Pending = "Pending"
    Reviewed = "Reviewed"
    Resolved = "Resolved"


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(PgEnum(FeedbackCategory), nullable=False)
    department = Column(String(150), nullable=False)
    is_anonymous = Column(Boolean, default=False)
    status = Column(PgEnum(FeedbackStatus), default=FeedbackStatus.Pending)
    submitted_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    submitter = relationship("User", foreign_keys=[submitted_by])
