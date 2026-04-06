from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token,
    get_current_user, validate_password_strength, sanitize_string,
)
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

# ── In-memory login attempt tracker (rate limiting) ────
# Keyed by IP address. Resets on successful login.
_login_attempts: dict[str, list] = {}
MAX_ATTEMPTS  = 5
WINDOW_SECS   = 300  # 5 minutes


def _check_rate_limit(ip: str):
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(seconds=WINDOW_SECS)

    attempts = _login_attempts.get(ip, [])
    # Keep only attempts within the window
    attempts = [t for t in attempts if t > window_start]
    _login_attempts[ip] = attempts

    if len(attempts) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail=f"Too many login attempts. Please wait {WINDOW_SECS // 60} minutes.",
        )


def _record_attempt(ip: str):
    from datetime import datetime, timezone
    _login_attempts.setdefault(ip, []).append(datetime.now(timezone.utc))


def _clear_attempts(ip: str):
    _login_attempts.pop(ip, None)


def _log(db: Session, action: str, detail: str = "",
         user_id: int = None, user_email: str = None, ip: str = None):
    db.add(ActivityLog(
        user_id=user_id, user_email=user_email,
        action=action, detail=detail[:500], ip_address=ip,
    ))
    # Don't commit here — caller commits


# ── Register ───────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    # Sanitize inputs
    name  = sanitize_string(payload.name, 120)
    email = payload.email.lower().strip()

    if not name:
        raise HTTPException(status_code=422, detail="Name cannot be blank")

    # Password strength check
    pw_errors = validate_password_strength(payload.password)
    if pw_errors:
        raise HTTPException(
            status_code=422,
            detail="Password too weak: " + ", ".join(pw_errors),
        )

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(payload.password),
        faculty=sanitize_string(payload.faculty, 120) if payload.faculty else None,
        year_of_study=payload.year_of_study,
    )
    db.add(user)
    db.flush()  # get user.id before commit

    ip = request.client.host if request.client else "unknown"
    _log(db, "user.register", f"New account: {email}", user.id, email, ip)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"user": user, "token": token}


# ── Login ──────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    _check_rate_limit(ip)

    email = payload.email.lower().strip()
    user  = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        _record_attempt(ip)
        remaining = MAX_ATTEMPTS - len(_login_attempts.get(ip, []))
        raise HTTPException(
            status_code=401,
            detail=f"Invalid email or password. {remaining} attempt(s) remaining.",
        )

    _clear_attempts(ip)
    _log(db, "user.login", f"Login: {email}", user.id, email, ip)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"user": user, "token": token}


# ── Me ─────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user