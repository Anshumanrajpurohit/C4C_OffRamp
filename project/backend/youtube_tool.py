"""Utility for backfilling YouTube recipe links."""
from __future__ import annotations

import os
from typing import Any, Dict, Optional

import httpx

from .data_loader import DataLoader


class YouTubeBackfillTool:
    """Finds and stores YouTube recipe tutorials when missing."""

    SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search"

    def __init__(self, data_loader: DataLoader, *, api_key: Optional[str] = None) -> None:
        self._data_loader = data_loader
        self._api_key = api_key or os.getenv("YOUTUBE_API_KEY")

    def ensure_video_url(self, recipe: Dict[str, Any]) -> Optional[str]:
        existing = self._extract_existing_url(recipe)
        if existing:
            return existing
        video_url = self._fetch_best_video(recipe.get("name")) if self._api_key else None
        if video_url:
            updated = self._data_loader.persist_recipe(recipe.get("name", ""), {"youtube_url": video_url})
            return updated.get("youtube_url") if updated else video_url
        return None

    def _extract_existing_url(self, recipe: Dict[str, Any]) -> Optional[str]:
        if recipe.get("youtube_url"):
            return recipe.get("youtube_url")
        if recipe.get("videoUrl"):
            return recipe.get("videoUrl")
        video_id = recipe.get("videoId")
        if video_id:
            return f"https://www.youtube.com/watch?v={video_id}"
        return None

    def _fetch_best_video(self, dish_name: Optional[str]) -> Optional[str]:
        if not dish_name:
            return None
        params = {
            "part": "snippet",
            "q": f"{dish_name} recipe",
            "key": self._api_key,
            "maxResults": 1,
            "type": "video",
            "videoEmbeddable": "true",
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(self.SEARCH_ENDPOINT, params=params)
                response.raise_for_status()
                payload = response.json()
        except Exception:
            return None
        items = payload.get("items") or []
        if not items:
            return None
        video_id = items[0].get("id", {}).get("videoId")
        if not video_id:
            return None
        return f"https://www.youtube.com/watch?v={video_id}"
