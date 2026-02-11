"""Candidate selection utilities."""

from __future__ import annotations

from typing import Iterable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Recipe


def select_candidates(
    db: Session,
    *,
    diet: str | None = None,
    dietary_restrictions: list[str] | None = None,
    include_ingredients: list[str] | None = None,
    exclude_ingredients: list[str] | None = None,
) -> list[Recipe]:
    """Return recipes filtered by diet, restrictions, and ingredient inclusion/exclusion."""

    stmt = select(Recipe)
    if diet:
        stmt = stmt.where(func.lower(Recipe.diet) == diet.strip().lower())

    recipes = db.scalars(stmt).all()
    restrictions = _normalize_collection(dietary_restrictions)
    include = _normalize_collection(include_ingredients)
    exclude = _normalize_collection(exclude_ingredients)

    filtered: list[Recipe] = []
    for recipe in recipes:
        ingredients = _normalize_collection(recipe.ingredients)
        if restrictions and not recipe.is_dietary_safe(list(restrictions)):
            continue
        if include and not include.issubset(ingredients):
            continue
        if exclude and (exclude & ingredients):
            continue
        filtered.append(recipe)
    return filtered


def _normalize_collection(values: Iterable[str] | None) -> set[str]:
    if not values:
        return set()
    return {
        item.strip().lower()
        for item in values
        if isinstance(item, str) and item.strip()
    }
