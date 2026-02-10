"""Ranking heuristics that stay anchored to the dataset."""
from __future__ import annotations

import math
import re
from typing import Any, Dict, List, Optional, Sequence


class RecommendationRanker:
    """Scores and sorts recipes for a smoother transition experience."""

    def __init__(self, reasoner: Optional["TransitionReasoner"] = None, *, reasoner_sample_size: int = 5) -> None:
        self._reasoner = reasoner
        self._reasoner_sample_size = max(1, reasoner_sample_size)

    def rank(self, recipes: Sequence[Dict[str, Any]], query: str = "") -> List[Dict[str, Any]]:
        if not recipes:
            return []
        scored = [(self._score(recipe, query), recipe) for recipe in recipes]
        scored.sort(key=lambda pair: pair[0], reverse=True)
        ordered = [recipe for _, recipe in scored]
        if self._reasoner and ordered:
            refined = self._reasoner.rerank([self._build_reasoner_payload(r) for r in ordered[: self._reasoner_sample_size]])
            ordered = self._merge_reasoner_view(refined, ordered)
        return ordered

    def _score(self, recipe: Dict[str, Any], query: str) -> float:
        text = self._combined_text(recipe)
        protein = self._protein_value(recipe.get("protein"))
        target_protein = 23.0
        protein_component = -abs((protein or target_protein) - target_protein)
        if protein and protein >= target_protein:
            protein_component += 4.0
        query_component = 0.0
        if query:
            for term in query.lower().split():
                if term and term in text:
                    query_component += 6.0
        replaces_component = 0.0
        replaces = " ".join(recipe.get("replaces") or []).lower()
        if query and query.lower() in replaces:
            replaces_component += 5.0
        cooking_style_bonus = 0.0
        if any(keyword in text for keyword in ("gravy", "masala", "tikka", "roast", "fried", "curry")):
            cooking_style_bonus = 3.0
        familiarity_bonus = 2.5 if "chicken" in recipe.get("name", "").lower() else 0.0
        data_completeness = 1.0 if recipe.get("protein") else 0.0
        return protein_component + query_component + replaces_component + cooking_style_bonus + familiarity_bonus + data_completeness

    def _combined_text(self, recipe: Dict[str, Any]) -> str:
        fields = [
            recipe.get("name", ""),
            recipe.get("heroSummary", ""),
            recipe.get("whyItWorks", ""),
            " ".join(recipe.get("categories") or []),
        ]
        return " ".join(fields).lower()

    @staticmethod
    def _protein_value(value: Any) -> Optional[float]:
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            match = re.search(r"\d+(?:\.\d+)?", value)
            if match:
                return float(match.group())
        return None

    def _build_reasoner_payload(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "name": recipe.get("name"),
            "protein": recipe.get("protein"),
            "heroSummary": recipe.get("heroSummary"),
            "whyItWorks": recipe.get("whyItWorks"),
            "cuisine": recipe.get("region") or recipe.get("state"),
            "replaces": recipe.get("replaces"),
        }

    def _merge_reasoner_view(self, refined_names: List[str], ordered: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not refined_names:
            return ordered
        lookup = {recipe.get("name"): recipe for recipe in ordered}
        seen = set()
        refined: List[Dict[str, Any]] = []
        for name in refined_names:
            recipe = lookup.get(name)
            if recipe and name not in seen:
                refined.append(recipe)
                seen.add(name)
        for recipe in ordered:
            name = recipe.get("name")
            if name not in seen:
                refined.append(recipe)
                seen.add(name)
        return refined


# Forward reference resolution
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    from .agent import TransitionReasoner
