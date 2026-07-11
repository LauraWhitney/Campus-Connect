from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationAudience, NotificationType


def notify_user(db: Session, user_id: int, type_: str, title: str, message: str, link: str | None = None) -> Notification:
    """Create an in-app notification for a single user (e.g. a student)."""
    n = Notification(
        audience=NotificationAudience.user,
        user_id=user_id,
        type=type_,
        title=title[:200],
        message=message[:500],
        link=link,
    )
    db.add(n)
    return n


def notify_admins(
    db: Session, type_: str, title: str, message: str, link: str | None = None,
    user_id: int | None = None, reply_to_email: str | None = None,
) -> Notification:
    """Create a single notification visible to every admin account.

    user_id/reply_to_email identify who an admin reply should reach: a
    registered user gets a new notification on their own page; someone
    without an account (e.g. the public Contact Us form) gets an email.
    """
    n = Notification(
        audience=NotificationAudience.admin,
        user_id=user_id,
        type=type_,
        title=title[:200],
        message=message[:500],
        link=link,
        reply_to_email=reply_to_email,
    )
    db.add(n)
    return n
