from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import engine, Base

# Import all models so Alembic / create_all can discover them
from app.models import user, event, marketplace, club, lost_found, feedback  # noqa: F401

from app.routers import auth, events, marketplace as marketplace_router, clubs, lost_found as lf_router, feedback as fb_router, admin as admin_router

# Create tables (for dev convenience — use Alembic in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS ───────────────────────────────────────────────
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
app.include_router(auth.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(marketplace_router.router, prefix="/api")
app.include_router(clubs.router, prefix="/api")
app.include_router(lf_router.router, prefix="/api")
app.include_router(fb_router.router, prefix="/api")
app.include_router(admin_router.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name, "version": settings.app_version}
