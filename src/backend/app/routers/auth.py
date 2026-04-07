from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import secrets
import hashlib
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token,
    get_current_user, validate_password_strength, sanitize_string,
)
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

# ── In-memory rate limiting ────────────────────────────
_login_attempts: dict[str, list] = {}
MAX_ATTEMPTS = 5
WINDOW_SECS  = 300

# ── In-memory password reset tokens ───────────────────
# { token_hash: { user_id, expires_at } }
_reset_tokens: dict[str, dict] = {}
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
    if not name:
        raise HTTPException(status_code=422, detail="Name cannot be blank")
    pw_errors = validate_password_strength(payload.password)
    if pw_errors:
        raise HTTPException(status_code=422, detail="Password too weak: " + ", ".join(pw_errors))
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


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user  = db.query(User).filter(User.email == email).first()

    # Always return 200 — don't reveal whether email exists
    if not user:
        return {"message": "If that email is registered, a reset token has been generated."}

    # Generate a secure token
    raw_token   = secrets.token_urlsafe(32)
    token_hash  = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at  = datetime.now(timezone.utc) + timedelta(minutes=RESET_EXPIRE_MINUTES)

    # Store (in production use DB table; here in-memory for prototype)
    _reset_tokens[token_hash] = {"user_id": user.id, "expires_at": expires_at}

    # In production this would be emailed. For the prototype, return it directly
    # so you can test without an email server.
    return {
        "message": "Reset token generated. In production this is emailed.",
        "reset_token": raw_token,   # remove this line in production
        "expires_in_minutes": RESET_EXPIRE_MINUTES,
    }


# ── Reset password — confirm with token ───────────────
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    record     = _reset_tokens.get(token_hash)

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if datetime.now(timezone.utc) > record["expires_at"]:
        del _reset_tokens[token_hash]
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    pw_errors = validate_password_strength(payload.new_password)
    if pw_errors:
        raise HTTPException(status_code=422, detail="Password too weak: " + ", ".join(pw_errors))

    user = db.query(User).filter(User.id == record["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(payload.new_password)
    del _reset_tokens[token_hash]
    db.commit()

    return {"message": "Password reset successfully. You can now log in."}