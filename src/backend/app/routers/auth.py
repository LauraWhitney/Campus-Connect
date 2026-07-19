from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import secrets
import hashlib
from typing import Optional
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.config import settings
from app.core.email_utils import send_email
from app.core.security import (
    hash_password, verify_password, create_access_token,
    get_current_user, validate_password_strength, sanitize_string,
)
from app.models.user import User, CUEA_EMAIL_DOMAINS, CUEA_FACULTIES
from app.models.activity_log import ActivityLog
from app.models.password_reset_token import PasswordResetToken
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

# ── In-memory rate limiting ────────────────────────────
_login_attempts: dict[str, list] = {}
MAX_ATTEMPTS = 5
WINDOW_SECS  = 300

RESET_EXPIRE_MINUTES = 30


def _check_rate_limit(ip: str):
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(seconds=WINDOW_SECS)
    attempts = [t for t in _login_attempts.get(ip, []) if t > window_start]
    _login_attempts[ip] = attempts
    if len(attempts) >= MAX_ATTEMPTS:
        raise HTTPException(status_code=429,
            detail=f"Too many login attempts. Please wait {WINDOW_SECS // 60} minutes.")


def _record_attempt(ip: str):
    from datetime import datetime, timezone
    _login_attempts.setdefault(ip, []).append(datetime.now(timezone.utc))


def _clear_attempts(ip: str):
    _login_attempts.pop(ip, None)


def _log(db, action, detail="", user_id=None, user_email=None, ip=None):
    db.add(ActivityLog(user_id=user_id, user_email=user_email,
                       action=action, detail=str(detail)[:500], ip_address=ip))


# ── Register ───────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    name  = sanitize_string(payload.name, 120)
    email = payload.email.lower().strip()
    # ── CUEA domain enforcement (belt-and-suspenders) ──
    domain = email.split('@')[-1]
    if domain not in CUEA_EMAIL_DOMAINS:
        raise HTTPException(
            status_code=400,
            detail="Only @cuea.edu email addresses are accepted"
        )
    if not name:
        raise HTTPException(status_code=422, detail="Name cannot be blank")
    pw_errors = validate_password_strength(payload.password)
    if pw_errors:
        raise HTTPException(status_code=422, detail="Password too weak: " + ", ".join(pw_errors))
    # ── CUEA faculty validation ──
    if payload.faculty and payload.faculty.strip() not in CUEA_FACULTIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid faculty. Must be one of: {', '.join(CUEA_FACULTIES)}"
        )
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=name, email=email, password_hash=hash_password(payload.password),
                faculty=sanitize_string(payload.faculty, 120) if payload.faculty else None,
                year_of_study=payload.year_of_study)
    db.add(user)
    db.flush()
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
        raise HTTPException(status_code=401,
            detail=f"Invalid email or password. {max(0, remaining)} attempt(s) remaining.")
    _clear_attempts(ip)
    _log(db, "user.login", f"Login: {email}", user.id, email, ip)
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"user": user, "token": token}


# ── Me ─────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Forgot password — request reset ───────────────────
class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    app_url: Optional[str] = None


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user  = db.query(User).filter(User.email == email).first()

    # Always return the same message — don't reveal whether the email exists
    generic_response = {"message": "If that email is registered, a reset link has been sent."}
    if not user:
        return generic_response

    # Generate a secure token, stored hashed so a DB leak can't be replayed
    raw_token   = secrets.token_urlsafe(32)
    token_hash  = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at  = datetime.now(timezone.utc) + timedelta(minutes=RESET_EXPIRE_MINUTES)

    db.add(PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    db.commit()

    # Only trust the caller's origin if it's one of our known frontends —
    # otherwise an attacker could get us to email a link to an arbitrary site.
    app_url = (payload.app_url or "").rstrip("/")
    origin = app_url if app_url in settings.origins_list else settings.origins_list[0]
    reset_link = f"{origin}/forgot-password?token={raw_token}"
    send_email(
        user.email,
        "Reset your Campus Connect password",
        f"Hi {user.name},\n\n"
        f"Click the link below to reset your Campus Connect password. "
        f"This link expires in {RESET_EXPIRE_MINUTES} minutes.\n\n"
        f"{reset_link}\n\n"
        f"If you didn't request this, you can safely ignore this email.",
    )

    return generic_response


# ── Reset password — confirm with token ───────────────
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash
    ).first()

    if not record or record.used_at is not None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if datetime.now(timezone.utc) > record.expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    pw_errors = validate_password_strength(payload.new_password)
    if pw_errors:
        raise HTTPException(status_code=422, detail="Password too weak: " + ", ".join(pw_errors))

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(payload.new_password)
    record.used_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Password reset successfully. You can now log in."}