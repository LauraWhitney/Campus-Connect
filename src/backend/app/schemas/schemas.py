from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from app.models.user import CUEA_FACULTIES, CUEA_EMAIL_DOMAINS


class PaginatedResponse(BaseModel):
    total:     int
    page:      int
    pages:     int
    page_size: int = 12


# ── Auth ───────────────────────────────────────────────

class UserRegister(BaseModel):
    name:          str
    email:         EmailStr
    password:      str
    faculty:       Optional[str] = None
    year_of_study: Optional[int] = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be blank")
        if len(v) > 120:
            raise ValueError("Name too long (max 120 chars)")
        return v

    @field_validator("email")
    @classmethod
    def cuea_email_only(cls, v: str) -> str:
        v = v.lower().strip()
        domain = v.split("@")[-1]
        if domain not in CUEA_EMAIL_DOMAINS:
            raise ValueError(
                "Only @cuea.edu email addresses are accepted"
            )
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("faculty")
    @classmethod
    def faculty_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v and v not in CUEA_FACULTIES:
            raise ValueError(f"Invalid faculty. Choose one of: {', '.join(CUEA_FACULTIES)}")
        return v

    @field_validator("year_of_study")
    @classmethod
    def year_valid(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 10):
            raise ValueError("Year of study must be between 1 and 10")
        return v


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


class UserOut(BaseModel):
    id:            int
    name:          str
    email:         str
    role:          str
    faculty:       Optional[str] = None
    year_of_study: Optional[int] = None
    avatar:        Optional[str] = None
    created_at:    datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    user:  UserOut
    token: str


# ── Events ─────────────────────────────────────────────

class EventCreate(BaseModel):
    title:       str
    description: str
    category:    str
    date:        str
    time:        str
    venue:       str
    organizer:   str
    capacity:    Optional[int] = None
    image:       Optional[str] = None

    @field_validator("title", "description", "venue", "organizer")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()

    @field_validator("capacity")
    @classmethod
    def capacity_positive(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("Capacity must be at least 1")
        return v

    @field_validator("date")
    @classmethod
    def date_not_past(cls, v: str) -> str:
        try:
            parsed = date.fromisoformat(v)
        except ValueError:
            raise ValueError("Date must be a valid ISO date (YYYY-MM-DD)")
        if parsed < date.today():
            raise ValueError("Event date cannot be in the past")
        return v


class EventOut(BaseModel):
    id:                  int
    title:               str
    description:         str
    category:            str
    date:                str
    time:                str
    venue:               str
    organizer:           str
    image:               Optional[str] = None
    capacity:            Optional[int] = None
    rsvp_count:          int  = 0
    pending_rsvp_count:  int  = 0
    has_rsvped:          bool = False
    pending_rsvp:        bool = False
    is_creator:          bool = False
    creator_name:        Optional[str] = None
    created_by:          Optional[int] = None
    created_at:          datetime

    model_config = {"from_attributes": True}


class EventListResponse(PaginatedResponse):
    data: List[EventOut]


class AttendanceOut(BaseModel):
    id:            int
    event_id:      int
    user_id:       int
    checked_in:    bool
    checked_in_at: Optional[datetime] = None
    created_at:    datetime

    model_config = {"from_attributes": True}


# ── Marketplace ────────────────────────────────────────

class MarketplaceItemCreate(BaseModel):
    title:       str
    description: str
    price:       Decimal
    condition:   str
    category:    str
    images:      Optional[List[str]] = []
    contact:     Optional[str] = None  # seller's contact info

    @field_validator("title", "description")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v


class SellerOut(BaseModel):
    id:    int
    name:  str
    email: str
    model_config = {"from_attributes": True}


class BuyerOut(BaseModel):
    id:    int
    name:  str
    email: str
    model_config = {"from_attributes": True}


class MarketplaceItemOut(BaseModel):
    id:          int
    title:       str
    description: str
    price:       Decimal
    condition:   str
    category:    str
    images:      List[str] = []
    contact:     Optional[str] = None
    seller:      SellerOut
    buyer:       Optional[BuyerOut] = None
    is_sold:     bool
    sold_at:     Optional[datetime] = None
    created_at:  datetime
    model_config = {"from_attributes": True}


class MarketplaceListResponse(PaginatedResponse):
    data: List[MarketplaceItemOut]


# ── Clubs ──────────────────────────────────────────────

class ClubCreate(BaseModel):
    name:             str
    description:      str
    category:         str
    president:        str
    email:            EmailStr
    meeting_schedule: Optional[str] = None
    meeting_location: Optional[str] = None
    logo:             Optional[str] = None

    @field_validator("name", "description", "president")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()


class ClubOut(BaseModel):
    id:               int
    name:             str
    description:      str
    category:         str
    president:        str
    email:            str
    meeting_schedule: Optional[str] = None
    meeting_location: Optional[str] = None
    logo:             Optional[str] = None
    member_count:     int  = 0
    is_member:        bool = False
    has_pending:      bool = False
    is_owner:         bool = False
    approval_status:  str  = "approved"
    rejection_reason: Optional[str] = None
    reviewed_at:      Optional[datetime] = None
    created_at:       datetime
    model_config = {"from_attributes": True}


class ClubListResponse(PaginatedResponse):
    data: List[ClubOut]


# ── Lost & Found ───────────────────────────────────────

class LostFoundCreate(BaseModel):
    title:       str
    description: str
    status:      str
    location:    str
    date:        str
    contact:     str
    image:       Optional[str] = None

    @field_validator("title", "description", "location", "contact")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()

    @field_validator("date")
    @classmethod
    def date_not_future(cls, v: str) -> str:
        try:
            parsed = date.fromisoformat(v)
        except ValueError:
            raise ValueError("Date must be a valid ISO date (YYYY-MM-DD)")
        if parsed > date.today():
            raise ValueError("Date cannot be in the future")
        return v


class ReporterOut(BaseModel):
    id:   int
    name: str
    model_config = {"from_attributes": True}


class ClaimerOut(BaseModel):
    id:   int
    name: str
    model_config = {"from_attributes": True}


class LostFoundOut(BaseModel):
    id:          int
    title:       str
    description: str
    status:      str
    location:    str
    date:        str
    image:       Optional[str] = None
    contact:     str
    reporter:    Optional[ReporterOut] = None
    reported_by: Optional[int] = None
    is_claimed:  bool
    claimed_by:  Optional[int]        = None
    claimer:     Optional[ClaimerOut] = None
    claimed_at:  Optional[datetime]   = None
    created_at:  datetime
    model_config = {"from_attributes": True}


class LostFoundListResponse(PaginatedResponse):
    data: List[LostFoundOut]


# ── Feedback ───────────────────────────────────────────

class FeedbackCreate(BaseModel):
    title:        str
    description:  str
    category:     str
    department:   str
    is_anonymous: bool = False

    @field_validator("title", "description", "department")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()


class FeedbackOut(BaseModel):
    id:           int
    title:        str
    description:  str
    category:     str
    department:   str
    is_anonymous: bool
    status:       str
    notified:     bool           = False
    submitted_by: Optional[ReporterOut] = None
    resolved_by:  Optional[int]  = None
    resolved_at:  Optional[datetime] = None
    created_at:   datetime
    model_config = {"from_attributes": True}


class FeedbackListResponse(PaginatedResponse):
    data: List[FeedbackOut]
