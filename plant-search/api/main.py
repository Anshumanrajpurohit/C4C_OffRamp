from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from db import init_db_pool, close_db_pool, get_db_connection
from engine.extractor import TRANSITION_CATEGORY_KEYS, load_feature_maps_from_db

from .routes import router

load_dotenv()

TOP_N_DEFAULT = int(os.getenv("TOP_N_DEFAULT", "10"))
UI_DIR = Path(__file__).resolve().parents[1] / "ui"

app = FastAPI(title="Plant-Based Transition Engine", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def serve_ui():
    """Serve the main UI page at root."""
    return FileResponse(UI_DIR / "index.html")


app.include_router(router)

# Mount static files (must be after routes to avoid conflicts)
app.mount("/ui", StaticFiles(directory=str(UI_DIR)), name="ui")


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize database connection pool on startup."""
    app.state.top_n_default = TOP_N_DEFAULT
    
    print("[STARTUP] Initializing AWS RDS PostgreSQL connection...")
    
    try:
        # Initialize database connection pool
        init_db_pool(min_conn=2, max_conn=20)
        
        # Test connection
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                print(f"[STARTUP] Connected to AWS RDS successfully")

        print("[STARTUP] Loading feature maps into memory for fast scoring...")
        feature_maps, category_counts, total_count, missing_categories = load_feature_maps_from_db()
        app.state.feature_maps = feature_maps
        app.state.missing_feature_map_categories = set(missing_categories)

        print("[STARTUP] Category counts:")
        for key in TRANSITION_CATEGORY_KEYS:
            print(f"- {key}: {category_counts.get(key, 0)}")
        print(f"[STARTUP] Total dishes: {total_count}")
        
        print("[STARTUP] System ready - using AWS RDS PostgreSQL database")
        
    except Exception as e:
        print(f"[STARTUP ERROR] Failed to initialize database: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Close database connection pool on shutdown."""
    print("[SHUTDOWN] Closing database connections...")
    close_db_pool()
    print("[SHUTDOWN] Database connections closed")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=False)
