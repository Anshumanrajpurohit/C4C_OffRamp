from __future__ import annotations

from typing import Any, Dict, List

from engine import DishFeatures
from engine.scorer import score_all

from .ingredient_matcher import ingredient_similarity


def rank_with_ingredients(
    source_features: DishFeatures,
    source_ingredients: List[str],
    candidate_features: Dict[str, DishFeatures],
    candidate_ingredients: Dict[str, List[str]],
) -> List[Dict[str, Any]]:
    base_scores = score_all(source_features, candidate_features)
    max_base = max((item["score"] for item in base_scores.values()), default=0)

    rows: List[Dict[str, Any]] = []
    for dish_id, payload in base_scores.items():
        base_score = float(payload["score"])
        ingredient_score, matched = ingredient_similarity(source_ingredients, candidate_ingredients.get(dish_id, []))

        if max_base > 0:
            base_norm = base_score / max_base
            weighted = (0.72 * base_norm) + (0.28 * ingredient_score)
        else:
            weighted = ingredient_score

        rows.append(
            {
                "dish_id": dish_id,
                "base_score": base_score,
                "similarity": round(weighted * 100, 2),
                "matched_ingredients": matched,
                "reasons": payload.get("reasons") or {},
            }
        )

    rows.sort(key=lambda item: (-item["similarity"], -item["base_score"], item["dish_id"]))
    return rows
