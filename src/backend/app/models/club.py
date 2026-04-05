from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum as PgEnum, DateTime, func, Table
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ClubCategory(str, enum.Enum):
    Academic = "Academic"
    Sports = "Sports"
    Arts = "Arts"
    Religious = "Religious"
    Technology = "Technology"
    Community = "Community"


club_members = Table(
    "club_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Column("club_id", Integer, ForeignKey("clubs.id", ondelete="CASCADE")),
)


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(PgEnum(ClubCategory), nullable=False)
    president = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False)
    meeting_schedule = Column(String(200), nullable=True)
    logo = Column(String(300), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", foreign_keys=[created_by])
    members = relationship("User", secondary=club_members, backref="clubs_joined")
