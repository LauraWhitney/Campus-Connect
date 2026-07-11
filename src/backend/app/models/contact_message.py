from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from app.core.database import Base


class ContactMessage(Base):
    """Messages submitted via the public 'Contact Us' form on the landing page."""
    __tablename__ = "contact_messages"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(150), nullable=False)
    email         = Column(String(255), nullable=False)
    message       = Column(Text, nullable=False)
    # ── Delivery bookkeeping ────────────────────────────
    email_sent    = Column(Boolean, default=False)   # True if the SMTP relay accepted it
    admin_notified= Column(Boolean, default=False)   # True once an in-app admin notification was created
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
