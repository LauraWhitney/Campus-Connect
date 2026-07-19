"""
Lightweight outgoing-email helper, backed by Resend.

If RESEND_API_KEY isn't configured (the default for local/dev environments),
`send_email` logs the message instead of raising — so Contact Us, password
reset, and other notification flows keep working end-to-end without
requiring a real API key. When `resend_api_key` *is* configured, it sends via
Resend's HTTP API and returns whether delivery succeeded.
"""
import logging

import resend

from app.core.config import settings

logger = logging.getLogger("app.email")


def send_email(to: str, subject: str, body: str) -> bool:
    """
    Attempt to deliver an email. Returns True if actually sent via Resend,
    False if only logged (no API key configured) or if sending failed.
    Never raises — callers should treat this as best-effort delivery and
    always fall back to in-app notifications for anything user-facing.
    """
    if not settings.resend_api_key:
        logger.info(
            "[email:not-configured] Would send to=%s subject=%r body=%r",
            to, subject, body,
        )
        return False

    try:
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": settings.mail_from,
            "to": [to],
            "subject": subject,
            "text": body,
        })
        return True
    except Exception as exc:  # noqa: BLE001 — email delivery must never crash the request
        logger.warning("[email:failed] Could not send to=%s subject=%r error=%s", to, subject, exc)
        return False
