"""FastAPI application exposing the plant-based transition agent."""
from __future__ import annotations

from pathlib import Path
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .agent import FoodTransitionAgent, TransitionReasoner, UIResponseFormatter
from .data_loader import DataLoader
from .filters import FilterEngine
from .recommender import RecommendationRanker
from .youtube_tool import YouTubeBackfillTool

load_dotenv()

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "output-recipe.json"

app = FastAPI(title="Plant-Based Transition API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_data_loader = DataLoader(DATA_PATH)
_filter_engine = FilterEngine()
_reasoner = TransitionReasoner()
_ranker = RecommendationRanker(_reasoner)
_youtube_tool = YouTubeBackfillTool(_data_loader)
_formatter = UIResponseFormatter()
_agent = FoodTransitionAgent(_data_loader, _filter_engine, _ranker, _youtube_tool, _formatter)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/recipes")
def list_recipes(
    diet: Literal["vegetarian", "vegan", "jain"] = Query("vegetarian"),
    query: str = Query("", max_length=80),
    tastes: Optional[List[str]] = Query(default=None),
) -> dict:
    dishes = _agent.recommend_dishes(diet, query, tastes or [])
    if not dishes:
        raise HTTPException(status_code=404, detail="No dishes match the current filters.")
    return {"dishes": dishes}


@app.get("/recipes/{slug_or_name}")
def recipe_detail(slug_or_name: str) -> dict:
    try:
        detail = _agent.recipe_detail(slug_or_name)
    except KeyError as exc:  # pragma: no cover - runtime guard
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if not detail.get("youtube_url"):
        detail["youtube_url"] = None
    return detail


@app.get("/tastes")
def taste_options() -> dict:
    return {"tastes": _data_loader.available_tastes()}
