"""Pydantic schemas for recipe entities."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

JsonDict = dict[str, Any]


class RecipeBase(BaseModel):
    """Shared attributes exposed by recipe endpoints."""

    model_config = ConfigDict(from_attributes=True)

    name: str
    state: str | None = None
    course: str | None = None
    diet: str
    replaces: list[str] = Field(default_factory=list)
    flavor_profile: str | None = None
    taste_profile: str | None = None
    hero_summary: str | None = None
    why_it_works: str | None = None
    ingredients: list[str] = Field(default_factory=list)
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    servings: int | None = None
    image_url: str | None = None
    texture_match: JsonDict = Field(default_factory=dict)
    texture_score: float | None = Field(
        default=None,
        description="Convenience field exposing similarity score if available.",
    )
    key_substitutions: list[JsonDict] = Field(default_factory=list)
    nutritional_data: JsonDict = Field(default_factory=dict)
    cultural_preservation: JsonDict = Field(default_factory=dict)
    dietary_restrictions: JsonDict = Field(default_factory=dict)
    transition_difficulty: str | None = None
    emotional_comfort: str | None = None
    availability_score: float | None = None

    @model_validator(mode="after")
    def _populate_texture_score(self) -> "RecipeBase":
        if self.texture_score is None and isinstance(self.texture_match, dict):
            raw_score = (
                self.texture_match.get("similarity_score")
                or self.texture_match.get("score")
                or self.texture_match.get("texture_score")
            )
            try:
                self.texture_score = float(raw_score) if raw_score is not None else None
            except (TypeError, ValueError):
                self.texture_score = None
        return self


class RecipeCreate(RecipeBase):
    """Payload for creating new recipes via the API."""

    texture_score: float | None = Field(
        default=None,
        ge=0,
        le=1,
        description="Optional texture similarity score stored alongside texture metadata.",
    )


class RecipeResponse(RecipeBase):
    """Representation returned to API consumers."""

    id: int
    created_at: datetime
    updated_at: datetime
    texture_score: float | None = Field(default=None, ge=0, le=1)


class RecipeFilterRequest(BaseModel):
    """Flexible filter payload used by the filter endpoint."""

    model_config = ConfigDict(from_attributes=True)

    diet: str | None = None
    dietary_restrictions: list[str] = Field(default_factory=list)
    include_ingredients: list[str] = Field(default_factory=list)
    exclude_ingredients: list[str] = Field(default_factory=list)
    reference_ingredients: list[str] = Field(
        default_factory=list,
        description="Ingredient list used to compute overlap scores.",
    )
    limit: int = Field(default=10, ge=1, le=100)
