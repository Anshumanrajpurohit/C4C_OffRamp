"""FastAPI application setup for VeganSwap."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.routers import swap

from .config import get_settings
from .database import Base, engine
from .routers import recipes_router

settings = get_settings()

app = FastAPI(title="VeganSwap API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recipes_router)
app.include_router(swap.router)

FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/ui", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "log_level": settings.log_level}


@app.get("/", include_in_schema=False)
def root() -> Response:
    if FRONTEND_DIR.exists():
        return RedirectResponse(url="/ui/", status_code=307)
    return JSONResponse({"message": "VeganSwap API", "docs": "/docs"})
