from __future__ import annotations

from difflib import SequenceMatcher
from typing import List

from .dataset_loader import DatasetDish


def rank_suggestions(term: str, dishes: List[DatasetDish], limit: int = 10) -> List[DatasetDish]:
    needle = term.strip().lower()
    if len(needle) < 2:
        return []

    scored = []
    for dish in dishes:
        name = dish.name.lower()
        ratio = SequenceMatcher(None, needle, name).ratio()
        prefix_boost = 0.6 if name.startswith(needle) else 0.0
        contains_boost = 0.25 if needle in name else 0.0
        score = ratio + prefix_boost + contains_boost
        if score >= 0.35:
            scored.append((score, dish.name, dish))

    scored.sort(key=lambda item: (-item[0], item[1]))
    return [dish for _, _, dish in scored[:limit]]
