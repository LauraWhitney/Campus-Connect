from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean,
    ForeignKey, Enum as PgEnum, func, Table
)
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class EventCategory(str, enum.Enum):
    Academic    = "Academic"
    Sports      = "Sports"
    Cultural    = "Cultural"
    Spiritual   = "Spiritual"
    Career      = "Career"
    Social      = "Social"
    Convocation = "Convocation"
    StaffDev    = "Staff Development"


class RSVPStatus(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"


# Many-to-many: users ↔ events (RSVP) - now using separate model for approval
event_rsvp = Table(
    "event_rsvps",
    Base.metadata,
    Column("user_id",  Integer, ForeignKey("users.id",  ondelete="CASCADE")),
    Column("event_id", Integer, ForeignKey("events.id", ondelete="CASCADE")),
)


class Event(Base):
    __tablename__ = "events"

    id         = Column(Integer, primary_key=True, index=True)
    title      = Column(String(200), nullable=False)
    description= Column(Text, nullable=False)
    category   = Column(PgEnum(EventCategory), nullable=False)
    date       = Column(String(20), nullable=False)   # ISO date string
    time       = Column(String(10), nullable=False)   # e.g. "14:00"
    venue      = Column(String(200), nullable=False)
    organizer  = Column(String(150), nullable=False)
    image      = Column(String(300), nullable=True)
    capacity   = Column(Integer, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", foreign_keys=[created_by])
    rsvps   = relationship("User", secondary=event_rsvp, backref="rsvped_events")
    rsvp_requests = relationship("EventRSVP", back_populates="event", cascade="all, delete-orphan")


class EventRSVP(Base):
    """Tracks RSVP requests with approval workflow."""
    __tablename__ = "event_rsvp_requests"

    id         = Column(Integer, primary_key=True, index=True)
    event_id   = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status     = Column(PgEnum(RSVPStatus), default=RSVPStatus.pending, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    event = relationship("Event", back_populates="rsvp_requests")
    user  = relationship("User", foreign_keys=[user_id])


# ── Event attendance (check-in after RSVP) ─────────────
class EventAttendance(Base):
    __tablename__ = "event_attendance"

    id           = Column(Integer, primary_key=True, index=True)
    event_id     = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id      = Column(Integer, ForeignKey("users.id",  ondelete="CASCADE"), nullable=False)
    checked_in   = Column(Boolean, default=False)
    checked_in_at= Column(DateTime(timezone=True), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", foreign_keys=[event_id])
    user  = relationship("User",  foreign_keys=[user_id])
