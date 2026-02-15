from __future__ import annotations

from typing import Dict, List

from . import DishFeatures


def rank_top_matches(
    score_map: Dict[str, Dict[str, object]],
    vegan_map: Dict[str, DishFeatures],
    top_n: int,
) -> List[Dict[str, object]]:
    ordered = sorted(
        score_map.items(),
        key=lambda item: item[1]["score"],
        reverse=True,
    )

    results: List[Dict[str, object]] = []
    for dish_id, payload in ordered[:top_n]:
        dish = vegan_map[dish_id]
        reasons_raw = payload["reasons"] or {}
        top_reasons = sorted(
            reasons_raw.items(),
            key=lambda kv: (-kv[1], kv[0]),
        )[:3]
        results.append(
            {
                "dish_id": dish_id,
                "name": dish.name,
                "score": payload["score"],
                "price_range": dish.price_range,
                "protein": dish.nutrition.protein,
                "availability": dish.availability,
                "reasons": [reason for reason, _ in top_reasons],
            }
        )
    return results
