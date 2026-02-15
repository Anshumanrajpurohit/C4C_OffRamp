from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class TasteProfile:
    umami_level: str
    umami_sources: List[str]
    salt_level: str
    sweet_level: str
    sour_level: str
    bitter_level: str
    spice_heat: str
    flavor_primary: List[str]
    flavor_secondary: List[str]
    intensity_overall: str
    complexity: str
    aftertaste_type: str
    aftertaste_duration: str


@dataclass
class NutritionProfile:
    protein: str
    energy: str
    fat: str


@dataclass
class DishFeatures:
    dish_id: str
    name: str
    category: str
    price_range: str
    availability: str
    taste: TasteProfile
    nutrition: NutritionProfile
    texture_tags: List[str] = field(default_factory=list)
    emotion_tags: List[str] = field(default_factory=list)


ScoreMap = Dict[str, Dict[str, float]]
