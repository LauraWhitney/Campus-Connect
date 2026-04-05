from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User
from app.models.event import Event
from app.schemas.schemas import EventCreate, EventOut, EventListResponse

router = APIRouter(prefix="/events", tags=["events"])

PAGE_SIZE = 12


def _event_out(event: Event, current_user: Optional[User]) -> dict:
    return {
        **{c.name: getattr(event, c.name) for c in event.__table__.columns},
        "rsvp_count": len(event.rsvps),
        "has_rsvped": current_user in event.rsvps if current_user else False,
    }


@router.get("", response_model=EventListResponse)
def list_events(
    page: int = Query(1, ge=1),
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Event)
    if category:
        query = query.filter(Event.category == category)

    total = query.count()
    events = query.order_by(Event.date.asc()).offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()

    return {
        "data": [_event_out(e, current_user) for e in events],
        "total": total,
        "page": page,
        "pages": max(1, math.ceil(total / PAGE_SIZE)),
        "page_size": PAGE_SIZE,
    }


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return _event_out(event, current_user)


@router.post("", response_model=EventOut, status_code=201)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = Event(**payload.model_dump(), created_by=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return _event_out(event, current_user)


@router.post("/{event_id}/rsvp")
def toggle_rsvp(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user in event.rsvps:
        event.rsvps.remove(current_user)
        action = "removed"
    else:
        if event.capacity and len(event.rsvps) >= event.capacity:
            raise HTTPException(status_code=400, detail="Event is at full capacity")
        event.rsvps.append(current_user)
        action = "added"

    db.commit()
    return {"action": action, "rsvp_count": len(event.rsvps)}


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorised")
    db.delete(event)
    db.commit()
