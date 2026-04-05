from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, ForeignKey, Enum as PgEnum, DateTime, func, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ItemCondition(str, enum.Enum):
    New = "New"
    Like_New = "Like New"
    Good = "Good"
    Fair = "Fair"


class ItemCategory(str, enum.Enum):
    Books = "Books"
    Electronics = "Electronics"
    Clothing = "Clothing"
    Stationery = "Stationery"
    Accommodation = "Accommodation"
    Other = "Other"


class MarketplaceItem(Base):
    __tablename__ = "marketplace_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    condition = Column(PgEnum(ItemCondition), nullable=False)
    category = Column(PgEnum(ItemCategory), nullable=False)
    images = Column(ARRAY(String), default=[])
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_sold = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    seller = relationship("User", foreign_keys=[seller_id])
