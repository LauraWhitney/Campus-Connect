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


def notify_admins(db: Session, type_: str, title: str, message: str, link: str | None = None) -> Notification:
    """Create a single notification visible to every admin account."""
    n = Notification(
        audience=NotificationAudience.admin,
        user_id=None,
        type=type_,
        title=title[:200],
        message=message[:500],
        link=link,
    )
    db.add(n)
    return n
