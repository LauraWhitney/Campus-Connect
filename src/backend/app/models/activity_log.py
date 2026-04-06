from sqlalchemy import Column, Integer, String, DateTime, func
from app.core.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, nullable=True)     # nullable for anonymous actions
    user_email = Column(String(255), nullable=True)
    action     = Column(String(100), nullable=False) # e.g. "user.register"
    detail     = Column(String(500), nullable=True)  # e.g. "Created event: Tech Talk"
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())