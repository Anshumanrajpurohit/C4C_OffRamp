"""SQLAlchemy recipe model definition."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Recipe(Base):
    """Represents a plant-forward recipe that can replace a non-vegetarian dish."""

    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    course: Mapped[str | None] = mapped_column(String(100), nullable=True)
    diet: Mapped[str] = mapped_column(String(25), nullable=False, index=True)
    replaces: Mapped[list[str] | None] = mapped_column(JSON, default=list)
    flavor_profile: Mapped[str | None] = mapped_column(Text, nullable=True)
    taste_profile: Mapped[str | None] = mapped_column(Text, nullable=True)
    hero_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    why_it_works: Mapped[str | None] = mapped_column(Text, nullable=True)
    ingredients: Mapped[list[str] | None] = mapped_column(JSON, default=list)
    prep_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cook_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    servings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    texture_match: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=dict)
    key_substitutions: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, default=list)
    nutritional_data: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=dict)
    cultural_preservation: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=dict)
    dietary_restrictions: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=dict)
    transition_difficulty: Mapped[str | None] = mapped_column(String(50), nullable=True)
    emotional_comfort: Mapped[str | None] = mapped_column(String(50), nullable=True)
    availability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def get_replaces_list(self) -> list[str]:
        """Return the list of non-vegetarian dishes this recipe can replace."""
        values = self._ensure_list(self.replaces)
        return [str(entry).strip() for entry in values if str(entry).strip()]

    def get_substitutions(self) -> list[dict[str, Any]]:
        """Return structured substitution details for the recipe."""
        substitutions: list[dict[str, Any]] = []
        for entry in self._ensure_list(self.key_substitutions):
            if isinstance(entry, dict):
                substitutions.append(entry)
        return substitutions

    def is_dietary_safe(self, restrictions: list[str]) -> bool:
        """Check whether the recipe satisfies the provided dietary restrictions."""
        if not restrictions:
            return True

        info = self._ensure_dict(self.dietary_restrictions)
        bool_flags = {
            key.lower(): value
            for key, value in info.items()
            if isinstance(value, bool)
        }

        for restriction in restrictions:
            normalized = (
                restriction.strip().lower().replace("-", "_").replace(" ", "_")
            )
            is_allowed = bool_flags.get(normalized, True)
            if not is_allowed:
                return False
        return True

    def get_texture_score(self) -> float:
        """Return the stored texture similarity score if present."""
        data = self._ensure_dict(self.texture_match)
        raw_score = (
            data.get("similarity_score")
            or data.get("score")
            or data.get("texture_score")
        )
        try:
            return float(raw_score)
        except (TypeError, ValueError):
            return 0.0

    @staticmethod
    def _ensure_list(value: Any) -> list[Any]:
        if value is None:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
            except ValueError:
                return [value]
            return parsed if isinstance(parsed, list) else [parsed]
        return []

    @staticmethod
    def _ensure_dict(value: Any) -> dict[str, Any]:
        if value is None:
            return {}
        if isinstance(value, dict):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
            except ValueError:
                return {}
            return parsed if isinstance(parsed, dict) else {}
        return {}
