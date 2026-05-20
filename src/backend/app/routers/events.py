from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
import math
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User
from app.models.event import Event, EventAttendance
from app.models.activity_log import ActivityLog
from app.schemas.schemas import EventCreate, EventOut, EventListResponse, AttendanceOut

router = APIRouter(prefix="/events", tags=["events"])
PAGE_SIZE = 12


def _log(db: Session, action: str, detail: str, user: User):
    db.add(ActivityLog(
        user_id=user.id, user_email=user.email,
        action=action, detail=detail[:500],
    ))


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
    total  = query.count()
    events = query.order_by(Event.date.asc()).offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
    return {
        "data":      [_event_out(e, current_user) for e in events],
        "total":     total, "page": page,
        "pages":     max(1, math.ceil(total / PAGE_SIZE)),
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
    db.flush()
    _log(db, "event.create", f"Created event: {event.title}", current_user)
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
        action_label = "cancelled RSVP"
        action_key   = "event.rsvp_cancel"
    else:
        if event.capacity and len(event.rsvps) >= event.capacity:
            raise HTTPException(status_code=400, detail="Event is at full capacity")
        event.rsvps.append(current_user)
        action_label = "RSVP'd"
        action_key   = "event.rsvp_add"

    _log(db, action_key, f"{current_user.email} {action_label} for: {event.title}", current_user)
    db.commit()
    return {"action": action_label, "rsvp_count": len(event.rsvps)}


# ── Attendance check-in ────────────────────────────────

@router.post("/{event_id}/checkin", response_model=AttendanceOut)
def check_in(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Confirm physical attendance at an event the user has RSVP'd for."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user not in event.rsvps:
        raise HTTPException(status_code=400, detail="You must RSVP before checking in")

    existing = db.query(EventAttendance).filter(
        and_(EventAttendance.event_id == event_id, EventAttendance.user_id == current_user.id)
    ).first()

    if existing:
        if existing.checked_in:
            raise HTTPException(status_code=400, detail="Already checked in to this event")
        existing.checked_in    = True
        existing.checked_in_at = datetime.now(timezone.utc)
        record = existing
    else:
        record = EventAttendance(
            event_id=event_id, user_id=current_user.id,
            checked_in=True, checked_in_at=datetime.now(timezone.utc),
        )
        db.add(record)

    _log(db, "event.checkin", f"{current_user.email} checked in to: {event.title}", current_user)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{event_id}/attendance")
def get_attendance(
    event_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Admin: list all check-ins for an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    records = db.query(EventAttendance).filter(EventAttendance.event_id == event_id).all()
    return {
        "event_id":        event_id,
        "event_title":     event.title,
        "rsvp_count":      len(event.rsvps),
        "checked_in_count": sum(1 for r in records if r.checked_in),
        "records":         records,
    }


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
    _log(db, "event.delete", f"Deleted event: {event.title}", current_user)
    db.delete(event)
    db.commit()
