from typing import List, Tuple
from sqlalchemy.orm import Session

from app.models.recipe import Recipe


def get_swap_suggestions(
    db: Session,
    dish_name: str,
    dietary_restrictions: List[str] | None = None,
    texture_preference: float | None = None,
) -> List[Tuple[Recipe, float]]:
    """
    Return top matching vegan recipes that can replace a non-vegan dish.
    Matching is based on:
    - Partial string match against `replaces`
    - Texture similarity scoring
    """

    dietary_restrictions = dietary_restrictions or []
    search = dish_name.lower().strip()

    candidates = db.query(Recipe).all()
    matches: List[Tuple[Recipe, float]] = []

    for recipe in candidates:

        # --- Handle replaces safely ---
        replaces = recipe.replaces or []

        if isinstance(replaces, str):
            replaces = [replaces]

        # --- Partial matching logic ---
        if not any(
            search in r.lower() or r.lower() in search
            for r in replaces
        ):
            continue

        # --- Optional dietary filtering ---
        if dietary_restrictions:
            recipe_restrictions = recipe.dietary_restrictions or {}

            if isinstance(recipe_restrictions, dict):
                recipe_restrictions = recipe_restrictions.keys()

            if not all(
                restriction in recipe_restrictions
                for restriction in dietary_restrictions
            ):
                continue

        # --- Texture scoring ---
        recipe_texture = 0
        if hasattr(recipe, "get_texture_score"):
            recipe_texture = recipe.get_texture_score() or 0

        score = recipe_texture

        if texture_preference is not None:
            score -= abs(texture_preference - recipe_texture)

        matches.append((recipe, score))

    # --- Sort by score descending ---
    matches.sort(key=lambda x: x[1], reverse=True)

    return matches[:5]
