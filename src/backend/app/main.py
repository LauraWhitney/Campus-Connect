from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import os
import sys
import time

from app.core.config import settings
from app.core.database import engine, Base

from app.models import user, event, marketplace, club, lost_found, feedback  # noqa: F401
from app.models import activity_log  # noqa: F401

from app.routers import (
    auth,
    events,
    marketplace as marketplace_router,
    clubs,
    lost_found as lf_router,
    feedback as fb_router,
    admin as admin_router,
)
from app.routers import activity as activity_router

# Windows cp1252 fix
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── Create tables ──────────────────────────────────────
try:
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables verified / created.")
except Exception as exc:
    print(f"[WARN] Could not reach database on startup: {exc}")
    print("  -> Check DATABASE_URL in src/backend/.env")


# ── Security headers middleware ────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"]  = "nosniff"
        response.headers["X-Frame-Options"]         = "DENY"
        response.headers["X-XSS-Protection"]        = "1; mode=block"
        response.headers["Referrer-Policy"]         = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"]      = "geolocation=(), microphone=(), camera=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "font-src 'self' data:;"
        )
        return response


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── Middleware (order matters — first added = outermost) ──
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file uploads ────────────────────────────────
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# ── Routers ────────────────────────────────────────────
app.include_router(auth.router,               prefix="/api")
app.include_router(events.router,             prefix="/api")
app.include_router(marketplace_router.router, prefix="/api")
app.include_router(clubs.router,              prefix="/api")
app.include_router(lf_router.router,          prefix="/api")
app.include_router(fb_router.router,          prefix="/api")
app.include_router(admin_router.router,       prefix="/api")
app.include_router(activity_router.router,    prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name, "version": settings.app_version}