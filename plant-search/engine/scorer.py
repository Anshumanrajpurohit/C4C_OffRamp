from __future__ import annotations

from collections import defaultdict
from typing import Dict, Iterable, List, Tuple

from . import DishFeatures

WEIGHTS = {
    "umami_level_exact": 3,
    "umami_level_close": 1,
    "umami_source_match": 2,
    "umami_source_close": 1,
    "seasoning_exact": 2,
    "seasoning_both_present": 1,
    "flavor_primary_match": 2,
    "flavor_secondary_match": 1,
    "intensity_exact": 2,
    "complexity_exact": 1,
    "aftertaste_type_exact": 2,
    "aftertaste_dur_exact": 1,
}

CLOSE_UMAMI_SOURCE_PAIRS = [
    ["meat-like", "fermented"],
    ["meat-like", "soy-based"],
    ["fermented", "aged"],
    ["broth-like", "fermented"],
    ["mushroom", "fermented"],
]

UMAMI_LEVEL_GROUPS = [
    {"delicate", "subtle", "light"},
    {"balanced", "medium", "moderate"},
    {"rich", "deep", "savory"},
    {"strong", "bold", "intense"},
]

SEASONING_KEYS = [
    ("salt_level", "salt nuance"),
    ("sweet_level", "sweet balance"),
    ("sour_level", "sour brightness"),
    ("bitter_level", "bitter edge"),
    ("spice_heat", "spice heat"),
]

CLOSE_SOURCE_SET = {frozenset(pair) for pair in CLOSE_UMAMI_SOURCE_PAIRS}


def _levels_close(a: str, b: str) -> bool:
    a = a or ""
    b = b or ""
    if a == b:
        return True
    for group in UMAMI_LEVEL_GROUPS:
        if a in group and b in group:
            return True
    return False


def _iter_matches(values: Iterable[str], other: Iterable[str]) -> Iterable[str]:
    return set(values).intersection(other)


def _iter_close_sources(values: Iterable[str], other: Iterable[str]) -> Iterable[Tuple[str, str]]:
    for left in values:
        for right in other:
            if frozenset({left, right}) in CLOSE_SOURCE_SET:
                yield left, right


def _both_present(a: str, b: str) -> bool:
    return bool(a and a != "none" and b and b != "none")


def score_pair(source: DishFeatures, candidate: DishFeatures) -> Tuple[int, Dict[str, float]]:
    total = 0
    contributions: Dict[str, float] = defaultdict(float)

    if candidate.taste.umami_level == source.taste.umami_level:
        total += WEIGHTS["umami_level_exact"]
        contributions["matched umami depth"] += WEIGHTS["umami_level_exact"]
    elif _levels_close(candidate.taste.umami_level, source.taste.umami_level):
        total += WEIGHTS["umami_level_close"]
        contributions["similar umami depth"] += WEIGHTS["umami_level_close"]

    for tag in _iter_matches(candidate.taste.umami_sources, source.taste.umami_sources):
        total += WEIGHTS["umami_source_match"]
        contributions[f"umami source: {tag}"] += WEIGHTS["umami_source_match"]

    for left, right in _iter_close_sources(candidate.taste.umami_sources, source.taste.umami_sources):
        total += WEIGHTS["umami_source_close"]
        contributions[f"balanced {left}/{right} umami"] += WEIGHTS["umami_source_close"]

    for attr, label in SEASONING_KEYS:
        cand_value = getattr(candidate.taste, attr)
        src_value = getattr(source.taste, attr)
        if cand_value == src_value:
            total += WEIGHTS["seasoning_exact"]
            contributions[f"{label} match"] += WEIGHTS["seasoning_exact"]
        elif _both_present(cand_value, src_value):
            total += WEIGHTS["seasoning_both_present"]
            contributions[f"{label} alignment"] += WEIGHTS["seasoning_both_present"]

    for tag in _iter_matches(candidate.taste.flavor_primary, source.taste.flavor_primary):
        total += WEIGHTS["flavor_primary_match"]
        contributions[f"primary flavor: {tag}"] += WEIGHTS["flavor_primary_match"]

    for tag in _iter_matches(candidate.taste.flavor_secondary, source.taste.flavor_secondary):
        total += WEIGHTS["flavor_secondary_match"]
        contributions[f"secondary flavor: {tag}"] += WEIGHTS["flavor_secondary_match"]

    if candidate.taste.intensity_overall == source.taste.intensity_overall:
        total += WEIGHTS["intensity_exact"]
        contributions["intensity match"] += WEIGHTS["intensity_exact"]

    if candidate.taste.complexity == source.taste.complexity:
        total += WEIGHTS["complexity_exact"]
        contributions["complexity match"] += WEIGHTS["complexity_exact"]

    if candidate.taste.aftertaste_type == source.taste.aftertaste_type:
        total += WEIGHTS["aftertaste_type_exact"]
        contributions["aftertaste type"] += WEIGHTS["aftertaste_type_exact"]

    if candidate.taste.aftertaste_duration == source.taste.aftertaste_duration:
        total += WEIGHTS["aftertaste_dur_exact"]
        contributions["aftertaste duration"] += WEIGHTS["aftertaste_dur_exact"]

    return total, dict(contributions)


def score_all(source: DishFeatures, vegan_map: Dict[str, DishFeatures]) -> Dict[str, Dict[str, object]]:
    results: Dict[str, Dict[str, object]] = {}
    for dish_id, candidate in vegan_map.items():
        score, reasons = score_pair(source, candidate)
        results[dish_id] = {"score": score, "reasons": reasons}
    return results
