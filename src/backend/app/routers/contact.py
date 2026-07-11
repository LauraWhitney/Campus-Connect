from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator

from app.core.database import get_db
from app.core.config import settings
from app.core.email_utils import send_email
from app.core.notify import notify_admins
from app.models.contact_message import ContactMessage

router = APIRouter(prefix="/contact", tags=["contact"])


class ContactMessageCreate(BaseModel):
    name:    str
    email:   EmailStr
    message: str

    @field_validator("name", "message")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be blank")
        return v


@router.post("", status_code=201)
def submit_contact_message(payload: ContactMessageCreate, db: Session = Depends(get_db)):
    """
    Handle a public 'Contact Us' submission.

    Delivery has two independent legs so a failure in one never blocks the
    other:
      1. Email to the system administrator (best-effort — logged if SMTP
         isn't configured, never raises).
      2. An in-app admin notification, which always succeeds as long as the
         database write does — this is the guaranteed delivery path admins
         can rely on even when no mail server is set up.
    """
    msg = ContactMessage(name=payload.name, email=payload.email, message=payload.message)
    db.add(msg)
    db.flush()

    email_body = (
        f"New Contact Us submission from {payload.name} <{payload.email}>:\n\n"
        f"{payload.message}"
    )
    msg.email_sent = send_email(
        to=settings.admin_contact_email,
        subject=f"[CUEA Campus Connect] New message from {payload.name}",
        body=email_body,
    )

    notify_admins(
        db,
        type_="contact",
        title="New Contact Us message",
        message=f"{payload.name} ({payload.email}): {payload.message[:120]}",
        link="/notifications",
        reply_to_email=payload.email,
    )
    msg.admin_notified = True

    db.commit()

    return {
        "message": "Your message has been delivered to the administrator. We'll get back to you shortly.",
        "email_sent": msg.email_sent,
    }
