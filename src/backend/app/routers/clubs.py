from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import math

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.club import Club
from app.schemas.schemas import ClubCreate, ClubOut, ClubListResponse

router = APIRouter(prefix="/clubs", tags=["clubs"])
PAGE_SIZE = 12


def _club_out(club: Club, current_user: User) -> dict:
    return {
        **{c.name: getattr(club, c.name) for c in club.__table__.columns},
        "member_count": len(club.members),
        "is_member": current_user in club.members,
    }


@router.get("", response_model=ClubListResponse)
def list_clubs(page: int = Query(1, ge=1), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = db.query(Club).count()
    clubs = db.query(Club).order_by(Club.name.asc()).offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
    return {"data": [_club_out(c, current_user) for c in clubs], "total": total, "page": page, "pages": max(1, math.ceil(total / PAGE_SIZE)), "page_size": PAGE_SIZE}


@router.get("/{club_id}", response_model=ClubOut)
def get_club(club_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return _club_out(club, current_user)


@router.post("", response_model=ClubOut, status_code=201)
def create_club(payload: ClubCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    club = Club(**payload.model_dump(), created_by=current_user.id)
    db.add(club)
    db.commit()
    db.refresh(club)
    return _club_out(club, current_user)


@router.post("/{club_id}/join")
def toggle_membership(club_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    if current_user in club.members:
        club.members.remove(current_user)
        action = "left"
    else:
        club.members.append(current_user)
        action = "joined"

    db.commit()
    return {"action": action, "member_count": len(club.members)}
