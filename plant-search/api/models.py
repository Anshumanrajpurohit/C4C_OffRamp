from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


class UmamiDepth(BaseModel):
    level: str = Field(..., description="Describes overall umami intensity")
    source: List[str] = Field(..., min_items=1)

    @validator("source", pre=True)
    def normalize_sources(cls, value):
        if isinstance(value, list):
            return [v.strip() for v in value if v and isinstance(v, str)]
        raise ValueError("source must be a list of strings")


class SeasoningProfile(BaseModel):
    salt_level: str
    sweet_level: str
    sour_level: str
    bitter_level: str
    spice_heat: str


class FlavorBase(BaseModel):
    primary: List[str] = Field(default_factory=list)
    secondary: List[str] = Field(default_factory=list)

    @validator("primary", "secondary", pre=True)
    def normalize_flavors(cls, value):
        if value is None:
            return []
        if isinstance(value, list):
            return [v.strip() for v in value if v and isinstance(v, str)]
        raise ValueError("flavor tags must be a list of strings")


class TasteIntensity(BaseModel):
    overall: str
    complexity: str


class Aftertaste(BaseModel):
    type: str
    duration: str


class TasteFeatures(BaseModel):
    umami_depth: UmamiDepth
    seasoning_profile: SeasoningProfile
    flavor_base: FlavorBase
    taste_intensity: TasteIntensity
    aftertaste: Aftertaste


class NutritionProfile(BaseModel):
    protein: str
    energy: str
    fat: str


class DishBase(BaseModel):
    name: str
    category: str = Field(..., pattern="^(vegan|non-vegan)$")
    price_range: str
    availability: str
    taste_features: TasteFeatures
    texture_features: List[str]
    emotion_features: List[str]
    nutrition: NutritionProfile

    @validator("texture_features", "emotion_features", pre=True)
    def normalize_tags(cls, value):
        if value is None:
            return []
        if isinstance(value, list):
            return [v.strip() for v in value if v and isinstance(v, str)]
        raise ValueError("tags must be provided as a list of strings")


class DishCreate(DishBase):
    id: Optional[str] = Field(None, description="Optional external identifier")


class DishResponse(DishBase):
    id: str
    created_at: datetime
    # Full raw data payload as imported from the JSON dataset (optional)
    # This can include UI-facing fields like image, ingredients, steps, etc.
    data: Optional[Dict[str, Any]] = None


class DishSummary(BaseModel):
    id: str
    name: str
    category: str
    price_range: str
    protein: str


class SearchRequest(BaseModel):
    dish_name: str
    top_n: Optional[int] = None
    from_: Optional[str] = Field(None, alias="from")
    to: Optional[str] = None


class SearchResult(BaseModel):
    dish_id: str
    name: str
    score: float
    price_range: str
    protein: str
    availability: str
    reasons: List[str]


class HealthResponse(BaseModel):
    status: str
    dish_count: int


class DeleteResponse(BaseModel):
    status: str
    deleted_id: str
