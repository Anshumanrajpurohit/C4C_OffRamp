"""Repository helpers for recipe queries."""

from __future__ import annotations

import logging
from collections.abc import Callable, Iterable
from functools import lru_cache
from typing import List, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..models import Recipe


class RecipeRepository:
    """Database access layer for recipe entities."""

    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self._session_factory = session_factory
        self._logger = logging.getLogger(self.__class__.__name__)

    def get_all(self, diet: str | None = None) -> List[Recipe]:
        """Return every recipe, optionally filtered by diet."""
        diet_key = self._normalize_diet(diet)
        return list(self._get_all_cached(diet_key))

    def find_by_id(self, recipe_id: int) -> Optional[Recipe]:
        """Fetch a recipe by its identifier."""
        with self._session_factory() as session:
            return session.get(Recipe, recipe_id)

    def find_by_replaces(self, term: str, diet: str) -> List[Recipe]:
        """Find recipes whose replacements mention the provided term."""
        if not term.strip():
            return []

        normalized_term = self._normalize_term(term)
        normalized_diet = self._normalize_diet(diet)
        return list(self._find_by_replaces_cached(normalized_term, normalized_diet))

    def find_by_text(self, term: str, diet: str) -> List[Recipe]:
        """Perform a text search across key recipe fields."""
        if not term.strip():
            return []

        normalized_term = self._normalize_term(term)
        normalized_diet = self._normalize_diet(diet)
        return list(self._find_by_text_cached(normalized_term, normalized_diet))

    def filter_by_dietary_restrictions(
        self, recipes: List[Recipe], restrictions: List[str]
    ) -> List[Recipe]:
        """Remove recipes that violate any of the provided restrictions."""
        if not restrictions:
            return recipes

        normalized = [self._normalize_restriction(item) for item in restrictions if item]
        filtered = [recipe for recipe in recipes if recipe.is_dietary_safe(normalized)]
        return filtered

    def clear_cache(self) -> None:
        """Invalidate any cached query results."""
        self._get_all_cached.cache_clear()
        self._find_by_text_cached.cache_clear()
        self._find_by_replaces_cached.cache_clear()

    @lru_cache(maxsize=128)
    def _get_all_cached(self, diet_key: str) -> tuple[Recipe, ...]:
        with self._session_factory() as session:
            stmt = select(Recipe)
            if diet_key != "__all__":
                stmt = stmt.where(func.lower(Recipe.diet) == diet_key)
            results = session.scalars(stmt).all()
            return tuple(results)

    @lru_cache(maxsize=256)
    def _find_by_replaces_cached(self, term: str, diet_key: str) -> tuple[Recipe, ...]:
        matches: list[Recipe] = []
        for recipe in self._get_all_cached(diet_key):
            replaces = [value.lower() for value in recipe.get_replaces_list()]
            if any(term in value for value in replaces):
                matches.append(recipe)
        return tuple(self._deduplicate(matches))

    @lru_cache(maxsize=256)
    def _find_by_text_cached(self, term: str, diet_key: str) -> tuple[Recipe, ...]:
        like_term = f"%{term}%"
        with self._session_factory() as session:
            stmt = (
                select(Recipe)
                .where(func.lower(Recipe.diet) == diet_key)
                .where(
                    or_(
                        func.lower(Recipe.name).like(like_term),
                        func.lower(Recipe.hero_summary).like(like_term),
                        func.lower(Recipe.why_it_works).like(like_term),
                    )
                )
            )
            results = session.scalars(stmt).all()
            return tuple(results)

    @staticmethod
    def _normalize_term(value: str) -> str:
        return value.strip().lower()

    @staticmethod
    def _normalize_diet(value: str | None) -> str:
        return value.strip().lower() if value else "__all__"

    @staticmethod
    def _normalize_restriction(value: str) -> str:
        return value.strip().lower().replace("-", "_").replace(" ", "_")

    @staticmethod
    def _deduplicate(recipes: Iterable[Recipe]) -> list[Recipe]:
        seen: set[int] = set()
        unique: list[Recipe] = []
        for recipe in recipes:
            if recipe.id is None:
                continue
            if recipe.id in seen:
                continue
            seen.add(recipe.id)
            unique.append(recipe)
        return unique
