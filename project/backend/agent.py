"""Agent orchestration layer for the plant-based transition platform."""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional, Sequence

import httpx

from .data_loader import DataLoader
from .filters import FilterEngine
from .recommender import RecommendationRanker
from .youtube_tool import YouTubeBackfillTool

LOGGER = logging.getLogger(__name__)


class TransitionReasoner:
    """Delegates ranking refinements to OpenRouter when credentials exist."""

    API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self, *, api_key: Optional[str] = None, model: Optional[str] = None) -> None:
        self._api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self._model = model or os.getenv("OPENROUTER_MODEL")

    def rerank(self, candidates: Sequence[Dict[str, Any]]) -> List[str]:
        if not candidates:
            return []
        if not self._api_key or not self._model:
            return [candidate.get("name") for candidate in candidates]
        prompt = self._build_prompt(candidates)
        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a deterministic ranking engine helping non-vegetarian users switch to plant-based meals."
                        "Return only dish names in preferred order, separated by newlines."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "HTTP-Referer": "plant-transition.local",
            "X-Title": "Plant Transition Agent",
        }
        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.post(self.API_ENDPOINT, json=payload, headers=headers)
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
        except Exception as exc:  # pragma: no cover - network/runtime failures
            LOGGER.warning("TransitionReasoner fallback to heuristic ordering: %s", exc)
            return [candidate.get("name") for candidate in candidates]
        parsed = self._parse_ranked_names(content, candidates)
        return parsed or [candidate.get("name") for candidate in candidates]

    @staticmethod
    def _build_prompt(candidates: Sequence[Dict[str, Any]]) -> str:
        lines = [
            "Rank these dishes for a chicken-to-plant transition. Consider protein grams, cuisine familiarity, and hero summary.",
            "Return only dish names, each on its own line.",
        ]
        for idx, candidate in enumerate(candidates, start=1):
            lines.append(
                f"{idx}. {candidate.get('name')} | protein: {candidate.get('protein')} | replacements: {candidate.get('replaces')} | summary: {candidate.get('heroSummary')}"
            )
        return "\n".join(lines)

    @staticmethod
    def _parse_ranked_names(response_text: str, candidates: Sequence[Dict[str, Any]]) -> List[str]:
        available = [candidate.get("name") for candidate in candidates]
        ordered: List[str] = []
        lower_map = {name.lower(): name for name in available if name}
        for line in response_text.splitlines():
            cleaned = line.strip().lstrip("-0123456789. ")
            key = cleaned.lower()
            for canonical_key, canonical_value in lower_map.items():
                if canonical_key == key or canonical_value.lower() in key:
                    if canonical_value not in ordered:
                        ordered.append(canonical_value)
                    break
        return ordered


class UIResponseFormatter:
    """Shapes deterministic payloads for the frontend."""

    PLACEHOLDER_TEXT = "Not available"

    def list_response(self, recipes: Sequence[Dict[str, Any]]) -> List[str]:
        return [recipe.get("name", "") for recipe in recipes]

    def detail_response(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        ingredients = recipe.get("ingredients") or []
        images_map = self._normalize_image_map(recipe.get("ingredientImages"))
        formatted_ingredients = [
            {
                "item": entry.get("item") or self.PLACEHOLDER_TEXT,
                "quantity": entry.get("quantity") or self.PLACEHOLDER_TEXT,
                "image": images_map.get((entry.get("item") or "").lower()),
            }
            for entry in ingredients
        ]
        details = {
            "name": recipe.get("name"),
            "diet": recipe.get("diet") or self.PLACEHOLDER_TEXT,
            "course": recipe.get("course") or self.PLACEHOLDER_TEXT,
            "category": ", ".join(recipe.get("categories") or []) or self.PLACEHOLDER_TEXT,
            "region": recipe.get("region") or recipe.get("state") or self.PLACEHOLDER_TEXT,
            "heroSummary": recipe.get("heroSummary") or "",
            "whyItWorks": recipe.get("whyItWorks") or "",
            "ingredients": formatted_ingredients,
            "steps": recipe.get("steps") or [],
            "nutrition": self._build_nutrition(recipe),
            "image": recipe.get("image"),
        }
        youtube_url = recipe.get("youtube_url") or recipe.get("videoUrl")
        if not youtube_url and recipe.get("videoId"):
            youtube_url = f"https://www.youtube.com/watch?v={recipe['videoId']}"
        details["youtube_url"] = youtube_url
        return details

    @staticmethod
    def _normalize_image_map(raw_map: Optional[Dict[str, str]]) -> Dict[str, str]:
        if not raw_map:
            return {}
        return {key.lower(): value for key, value in raw_map.items() if isinstance(key, str) and value}

    def _build_nutrition(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        default_text = self.PLACEHOLDER_TEXT
        return {
            "protein": recipe.get("protein") or default_text,
            "calories": recipe.get("calories") or default_text,
            "fiber": recipe.get("fiber") or default_text,
        }


class FoodTransitionAgent:
    """Coordinates loading, filtering, ranking, and enrichment."""

    def __init__(
        self,
        data_loader: DataLoader,
        filter_engine: FilterEngine,
        ranker: RecommendationRanker,
        youtube_tool: YouTubeBackfillTool,
        formatter: UIResponseFormatter,
    ) -> None:
        self._loader = data_loader
        self._filter_engine = filter_engine
        self._ranker = ranker
        self._youtube_tool = youtube_tool
        self._formatter = formatter

    def recommend_dishes(self, diet: str, query: str) -> List[str]:
        recipes = self._loader.load_recipes()
        filtered = self._filter_engine.apply(recipes, diet)
        ranked = self._ranker.rank(filtered, query)
        return self._formatter.list_response(ranked)

    def recipe_detail(self, slug_or_name: str) -> Dict[str, Any]:
        recipe = self._loader.get_recipe(slug_or_name)
        if not recipe:
            raise KeyError("Recipe not found in dataset")
        youtube_url = self._youtube_tool.ensure_video_url(recipe)
        if youtube_url and not recipe.get("youtube_url"):
            recipe["youtube_url"] = youtube_url
        return self._formatter.detail_response(recipe)
