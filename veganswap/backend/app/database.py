"""Database session and engine helpers."""

from __future__ import annotations

from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from .config import get_settings

settings = get_settings()


def _build_engine(database_url: str) -> Engine:
    """Create a SQLAlchemy engine for the configured database URL."""
    connect_args: dict[str, Any] = {}

    # Required for SQLite only
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    return create_engine(
        database_url,
        connect_args=connect_args,
        pool_pre_ping=True,
        future=True,
    )


# ✅ Proper engine creation
engine: Engine = _build_engine(settings.database_url)

# ✅ Session factory
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    future=True,
)

# ✅ Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Provide a database session suitable for FastAPI dependency injection.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
