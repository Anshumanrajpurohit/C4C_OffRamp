"""Recipe ranking helpers."""

from __future__ import annotations

from typing import Iterable

from ..models import Recipe


def rank_recipes(
    recipes: list[Recipe],
    *,
    reference_ingredients: Iterable[str] | None = None,
    weight_texture: float = 0.6,
    weight_overlap: float = 0.4,
) -> list[tuple[Recipe, float]]:
    """Score recipes using texture similarity and ingredient overlap."""

    texture_weight, overlap_weight = _normalize_weights(weight_texture, weight_overlap)
    reference_set = {
        item.strip().lower()
        for item in (reference_ingredients or [])
        if isinstance(item, str) and item.strip()
    }

    ranked: list[tuple[Recipe, float]] = []
    for recipe in recipes:
        texture_score = max(0.0, min(1.0, recipe.get_texture_score()))
        overlap_score = _compute_overlap(reference_set, recipe)
        combined = texture_score * texture_weight + overlap_score * overlap_weight
        ranked.append((recipe, combined))

    ranked.sort(key=lambda pair: pair[1], reverse=True)
    return ranked


def _compute_overlap(reference_set: set[str], recipe: Recipe) -> float:
    if not reference_set:
        return 0.0
    ingredient_set = {
        item.strip().lower()
        for item in (recipe.ingredients or [])
        if isinstance(item, str) and item.strip()
    }
    if not ingredient_set:
        return 0.0
    return len(reference_set & ingredient_set) / len(reference_set)


def _normalize_weights(weight_texture: float, weight_overlap: float) -> tuple[float, float]:
    total = max(weight_texture + weight_overlap, 1e-6)
    return weight_texture / total, weight_overlap / total
