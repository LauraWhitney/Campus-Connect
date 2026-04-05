from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ── Shared ─────────────────────────────────────────────
class PaginatedResponse(BaseModel):
    total: int
    page: int
    pages: int
    page_size: int = 12


# ── Auth / User ────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    faculty: Optional[str] = None
    year_of_study: Optional[int] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    faculty: Optional[str] = None
    year_of_study: Optional[int] = None
    avatar: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    user: UserOut
    token: str


# ── Events ────────────────────────────────────────────
class EventCreate(BaseModel):
    title: str
    description: str
    category: str
    date: str
    time: str
    venue: str
    organizer: str
    capacity: Optional[int] = None
    image: Optional[str] = None


class EventOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    date: str
    time: str
    venue: str
    organizer: str
    image: Optional[str] = None
    capacity: Optional[int] = None
    rsvp_count: int = 0
    has_rsvped: bool = False
    created_by: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EventListResponse(PaginatedResponse):
    data: List[EventOut]


# ── Marketplace ───────────────────────────────────────
class MarketplaceItemCreate(BaseModel):
    title: str
    description: str
    price: Decimal
    condition: str
    category: str
    images: Optional[List[str]] = []


class SellerOut(BaseModel):
    id: int
    name: str
    email: str

    model_config = {"from_attributes": True}


class MarketplaceItemOut(BaseModel):
    id: int
    title: str
    description: str
    price: Decimal
    condition: str
    category: str
    images: List[str] = []
    seller: SellerOut
    is_sold: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MarketplaceListResponse(PaginatedResponse):
    data: List[MarketplaceItemOut]


# ── Clubs ─────────────────────────────────────────────
class ClubCreate(BaseModel):
    name: str
    description: str
    category: str
    president: str
    email: EmailStr
    meeting_schedule: Optional[str] = None
    logo: Optional[str] = None


class ClubOut(BaseModel):
    id: int
    name: str
    description: str
    category: str
    president: str
    email: str
    meeting_schedule: Optional[str] = None
    logo: Optional[str] = None
    member_count: int = 0
    is_member: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class ClubListResponse(PaginatedResponse):
    data: List[ClubOut]


# ── Lost & Found ──────────────────────────────────────
class LostFoundCreate(BaseModel):
    title: str
    description: str
    status: str
    location: str
    date: str
    contact: str
    image: Optional[str] = None


class ReporterOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class LostFoundOut(BaseModel):
    id: int
    title: str
    description: str
    status: str
    location: str
    date: str
    image: Optional[str] = None
    contact: str
    reporter: Optional[ReporterOut] = None
    is_claimed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LostFoundListResponse(PaginatedResponse):
    data: List[LostFoundOut]


# ── Feedback ──────────────────────────────────────────
class FeedbackCreate(BaseModel):
    title: str
    description: str
    category: str
    department: str
    is_anonymous: bool = False


class FeedbackOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    department: str
    is_anonymous: bool
    status: str
    submitted_by: Optional[ReporterOut] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FeedbackListResponse(PaginatedResponse):
    data: List[FeedbackOut]
