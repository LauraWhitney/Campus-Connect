from sqlalchemy import Column, Integer, String, Enum as PgEnum, DateTime, func
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"
    lecturer = "lecturer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(PgEnum(UserRole), default=UserRole.student, nullable=False)
    faculty = Column(String(120), nullable=True)
    year_of_study = Column(Integer, nullable=True)
    avatar = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
