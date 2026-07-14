from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum as PgEnum, DateTime, func, Table, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ClubCategory(str, enum.Enum):
    Academic         = "Academic"
    Sports           = "Sports"
    Arts             = "Arts"
    CatholicMinistry = "Catholic Ministry"
    Technology       = "Technology"
    Law              = "Law Society"
    Music            = "Music & Performing Arts"
    Community        = "Community Service"
    Science          = "Science"


class MembershipStatus(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"


class ClubApprovalStatus(str, enum.Enum):
    pending  = "pending"   # awaiting admin review
    approved = "approved"  # confirmed by admin
    rejected = "rejected"  # rejected; owner may re-register


club_members = Table(
    "club_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Column("club_id", Integer, ForeignKey("clubs.id",  ondelete="CASCADE")),
)


class Club(Base):
    __tablename__ = "clubs"

    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String(150), nullable=False, unique=True)
    description      = Column(Text, nullable=False)
    category         = Column(PgEnum(ClubCategory), nullable=False)
    president        = Column(String(120), nullable=False)
    email            = Column(String(255), nullable=False)
    meeting_schedule = Column(String(200), nullable=True)
    meeting_location = Column(String(200), nullable=True)
    logo             = Column(String(300), nullable=True)
    created_by       = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    # ── Approval workflow ──────────────────────────────
    approval_status  = Column(PgEnum(ClubApprovalStatus), default=ClubApprovalStatus.pending, nullable=False)
    rejection_reason = Column(String(500), nullable=True)
    reviewed_by      = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at      = Column(DateTime(timezone=True), nullable=True)
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    creator          = relationship("User", foreign_keys=[created_by])
    reviewer         = relationship("User", foreign_keys=[reviewed_by])
    members          = relationship("User", secondary=club_members, backref="clubs_joined")
    membership_requests = relationship("ClubMembershipRequest", back_populates="club", cascade="all, delete-orphan")


class ClubMembershipRequest(Base):
    """Membership request with approval workflow."""
    __tablename__ = "club_membership_requests"

    id              = Column(Integer, primary_key=True, index=True)
    club_id         = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course          = Column(String(200), nullable=False)
    year_of_study   = Column(Integer, nullable=False)
    full_name       = Column(String(120), nullable=False)
    phone_number    = Column(String(30), nullable=False)
    # ── Deprecated: replaced by the member's @cuea.edu email (see user.email) ──
    # Kept nullable for backward compatibility with existing rows; no longer
    # collected from the join form or required by the API.
    admission_number= Column(String(50), nullable=True)
    status          = Column(PgEnum(MembershipStatus), default=MembershipStatus.pending, nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    club = relationship("Club", back_populates="membership_requests")
    user = relationship("User", foreign_keys=[user_id])
