"""
Lightweight outgoing-email helper.

If SMTP settings aren't configured (the default for local/dev environments),
`send_email` logs the message instead of raising — so Contact Us and other
notification flows keep working end-to-end without requiring a real mail
server. When `smtp_host` *is* configured, it sends over SMTP (STARTTLS if
`smtp_use_tls` is true) and returns whether delivery succeeded.
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

logger = logging.getLogger("app.email")


def send_email(to: str, subject: str, body: str) -> bool:
    """
    Attempt to deliver an email. Returns True if actually sent via SMTP,
    False if only logged (no SMTP configured) or if sending failed.
    Never raises — callers should treat this as best-effort delivery and
    always fall back to in-app notifications for anything user-facing.
    """
    if not settings.smtp_host:
        logger.info(
            "[email:not-configured] Would send to=%s subject=%r body=%r",
            to, subject, body,
        )
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.mail_from
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            if settings.smtp_use_tls:
                server.starttls()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.mail_from, [to], msg.as_string())
        return True
    except Exception as exc:  # noqa: BLE001 — email delivery must never crash the request
        logger.warning("[email:failed] Could not send to=%s subject=%r error=%s", to, subject, exc)
        return False
