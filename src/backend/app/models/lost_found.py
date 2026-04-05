from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Enum as PgEnum, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ItemStatus(str, enum.Enum):
    Lost = "Lost"
    Found = "Found"
    Claimed = "Claimed"


class LostFoundItem(Base):
    __tablename__ = "lost_found_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(PgEnum(ItemStatus), nullable=False)
    location = Column(String(200), nullable=False)
    date = Column(String(20), nullable=False)
    image = Column(String(300), nullable=True)
    contact = Column(String(150), nullable=False)
    reported_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_claimed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reporter = relationship("User", foreign_keys=[reported_by])
