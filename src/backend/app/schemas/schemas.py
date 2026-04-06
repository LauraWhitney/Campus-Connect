from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class PaginatedResponse(BaseModel):
    total: int
    page: int
    pages: int
    page_size: int = 12


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    faculty: Optional[str] = None
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

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("faculty")
    @classmethod
    def faculty_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v.strip()) > 120:
            raise ValueError("Faculty name too long")
        return v.strip() if v else v

    @field_validator("year_of_study")
    @classmethod
    def year_valid(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 10):
            raise ValueError("Year of study must be between 1 and 10")
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


class MarketplaceItemCreate(BaseModel):
    title: str
    description: str
    price: Decimal
    condition: str
    category: str
    images: Optional[List[str]] = []

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


class ClubCreate(BaseModel):
    name: str
    description: str
    category: str
    president: str
    email: EmailStr
    meeting_schedule: Optional[str] = None
    logo: Optional[str] = None

    @field_validator("name", "description", "president")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()


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


class LostFoundCreate(BaseModel):
    title: str
    description: str
    status: str
    location: str
    date: str
    contact: str
    image: Optional[str] = None

    @field_validator("title", "description", "location", "contact")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()


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


class FeedbackCreate(BaseModel):
    title: str
    description: str
    category: str
    department: str
    is_anonymous: bool = False

    @field_validator("title", "description", "department")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()


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
