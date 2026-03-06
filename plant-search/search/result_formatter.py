from __future__ import annotations

from typing import Any, Dict, List

from engine import DishFeatures


def build_search_results(
    ranked_rows: List[Dict[str, Any]],
    candidate_features: Dict[str, DishFeatures],
    source_name: str,
    from_dataset: str,
    to_dataset: str,
    top_n: int,
) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []

    for row in ranked_rows[:top_n]:
        dish = candidate_features[row["dish_id"]]
        reasons_raw = row.get("reasons") or {}
        top_reasons = sorted(reasons_raw.items(), key=lambda kv: (-kv[1], kv[0]))[:3]

        results.append(
            {
                "dish_id": dish.dish_id,
                "name": dish.name,
                "score": row["base_score"],
                "price_range": dish.price_range,
                "protein": dish.nutrition.protein,
                "availability": dish.availability,
                "reasons": [reason for reason, _ in top_reasons],
                "from_dish": source_name,
                "from_dataset": from_dataset,
                "to_dataset": to_dataset,
                "similarity": row["similarity"],
                "matched_ingredients": row.get("matched_ingredients") or [],
            }
        )

    return results
