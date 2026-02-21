from __future__ import annotations

from typing import Dict, List, Any, Tuple

from . import DishFeatures, NutritionProfile, TasteProfile


def _to_lower(value: str) -> str:
    return value.lower() if isinstance(value, str) else value


def _normalize_list(values: List[str]) -> List[str]:
    if values is None:
        return []
    return [v.lower() for v in values if v]


TRANSITION_CATEGORY_KEYS = ["non-vegan", "veg", "vegetarian", "vegan", "jain", "keto"]
CATEGORY_TABLES = {
    "non-vegan": "dishes_non_vegan",
    "veg": "dishes_veg",
    "vegetarian": "dishes_vegetarian",
    "vegan": "dishes_vegan",
    "jain": "dishes_jain",
    "keto": "dishes_keto",
}


def normalize_transition_category(value: Any) -> str:
    raw = _to_lower(value) if isinstance(value, str) else ""
    if raw == "veg":
        return "veg"
    if raw in {"vegetarian", "vegeterian"}:
        return "vegetarian"
    if raw in {"nonveg", "non_veg"}:
        return "non-vegan"
    if raw in {"non-vegan", "veg", "vegetarian", "vegan", "jain", "keto"}:
        return raw
    return "vegan"


def dict_to_features(dish_dict: Dict[str, Any]) -> DishFeatures:
    """Convert a dish dictionary to DishFeatures."""
    tf = dish_dict["taste_features"]
    
    taste = TasteProfile(
        umami_level=_to_lower(tf["umami_depth"]["level"]),
        umami_sources=_normalize_list(tf["umami_depth"]["source"]),
        salt_level=_to_lower(tf["seasoning_profile"]["salt_level"]),
        sweet_level=_to_lower(tf["seasoning_profile"]["sweet_level"]),
        sour_level=_to_lower(tf["seasoning_profile"]["sour_level"]),
        bitter_level=_to_lower(tf["seasoning_profile"]["bitter_level"]),
        spice_heat=_to_lower(tf["seasoning_profile"]["spice_heat"]),
        flavor_primary=_normalize_list(tf["flavor_base"]["primary"]),
        flavor_secondary=_normalize_list(tf["flavor_base"]["secondary"]),
        intensity_overall=_to_lower(tf["taste_intensity"]["overall"]),
        complexity=_to_lower(tf["taste_intensity"]["complexity"]),
        aftertaste_type=_to_lower(tf["aftertaste"]["type"]),
        aftertaste_duration=_to_lower(tf["aftertaste"]["duration"]),
    )

    nutrition = NutritionProfile(
        protein=_to_lower(dish_dict["nutrition"]["protein"]),
        energy=_to_lower(dish_dict["nutrition"]["energy"]),
        fat=_to_lower(dish_dict["nutrition"]["fat"]),
    )

    return DishFeatures(
        dish_id=dish_dict.get("id", ""),
        name=dish_dict["name"],
        category=normalize_transition_category(dish_dict["category"]),
        price_range=dish_dict["price_range"],
        availability=dish_dict["availability"],
        taste=taste,
        nutrition=nutrition,
        texture_tags=_normalize_list(dish_dict.get("texture_features", [])),
        emotion_tags=_normalize_list(dish_dict.get("emotion_features", [])),
    )


def dict_to_dish_response(dish_dict: Dict[str, Any]):
    """Convert a dish dictionary to DishResponse API model."""
    from api.models import (
        DishResponse, TasteFeatures, UmamiDepth, SeasoningProfile,
        FlavorBase, TasteIntensity, Aftertaste, NutritionProfile as ApiNutrition
    )
    from datetime import datetime

    tf = dish_dict["taste_features"]
    
    payload = {
        "id": dish_dict.get("id", ""),
        "name": dish_dict["name"],
        "category": dish_dict["category"],
        "price_range": dish_dict["price_range"],
        "availability": dish_dict["availability"],
        "texture_features": dish_dict.get("texture_features", []),
        "emotion_features": dish_dict.get("emotion_features", []),
        "created_at": dish_dict.get("created_at", datetime.now()),
        "taste_features": TasteFeatures(
            umami_depth=UmamiDepth(
                level=tf["umami_depth"]["level"],
                source=tf["umami_depth"]["source"],
            ),
            seasoning_profile=SeasoningProfile(
                salt_level=tf["seasoning_profile"]["salt_level"],
                sweet_level=tf["seasoning_profile"]["sweet_level"],
                sour_level=tf["seasoning_profile"]["sour_level"],
                bitter_level=tf["seasoning_profile"]["bitter_level"],
                spice_heat=tf["seasoning_profile"]["spice_heat"],
            ),
            flavor_base=FlavorBase(
                primary=tf["flavor_base"]["primary"],
                secondary=tf["flavor_base"]["secondary"],
            ),
            taste_intensity=TasteIntensity(
                overall=tf["taste_intensity"]["overall"],
                complexity=tf["taste_intensity"]["complexity"],
            ),
            aftertaste=Aftertaste(
                type=tf["aftertaste"]["type"],
                duration=tf["aftertaste"]["duration"],
            ),
        ),
        "nutrition": ApiNutrition(
            protein=dish_dict["nutrition"]["protein"],
            energy=dish_dict["nutrition"]["energy"],
            fat=dish_dict["nutrition"]["fat"],
        ),
    }
    # If the full JSON payload is present (from the `data` column), surface it
    # so that frontend clients can access UI-focused fields like images,
    # ingredients, steps, etc.
    if "data" in dish_dict:
        payload["data"] = dish_dict["data"]
    return DishResponse(**payload)


def load_feature_maps(dishes: List[Dict[str, Any]]) -> Dict[str, Dict[str, DishFeatures]]:
    """Convert dish rows to feature maps keyed by normalized transition category then dish id."""
    maps: Dict[str, Dict[str, DishFeatures]] = {key: {} for key in TRANSITION_CATEGORY_KEYS}
    for dish_dict in dishes:
        dish_id = dish_dict.get("id", "")
        if not dish_id:
            continue
        category = normalize_transition_category(dish_dict.get("category"))
        maps.setdefault(category, {})
        maps[category][dish_id] = dict_to_features(dish_dict)
    return maps


def load_feature_maps_from_db() -> Tuple[Dict[str, Dict[str, DishFeatures]], Dict[str, int], int, List[str]]:
    """Load all dishes from category-specific tables and build per-category feature maps."""
    from db import get_db_connection
    from psycopg2.extras import RealDictCursor

    category_counts: Dict[str, int] = {key: 0 for key in TRANSITION_CATEGORY_KEYS}
    feature_maps: Dict[str, Dict[str, DishFeatures]] = {key: {} for key in TRANSITION_CATEGORY_KEYS}
    missing_tables: Dict[str, bool] = {key: False for key in TRANSITION_CATEGORY_KEYS}

    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            for category in TRANSITION_CATEGORY_KEYS:
                table_name = CATEGORY_TABLES[category]
                cursor.execute("SELECT to_regclass(%s) AS table_ref", (f"public.{table_name}",))
                exists_row = cursor.fetchone() or {}
                if not exists_row.get("table_ref"):
                    missing_tables[category] = True
                    print(f"[STARTUP] Missing table '{table_name}'. Treating {category} count as 0.")
                    continue

                cursor.execute(
                    f"""
                    SELECT id, name, price_range, availability,
                           taste_features, texture_features, emotion_features, nutrition
                    FROM {table_name}
                    ORDER BY name
                    """
                )
                rows = cursor.fetchall()
                category_counts[category] = len(rows)

                for row in rows:
                    dish = dict(row)
                    dish["category"] = category
                    dish_id = dish.get("id", "")
                    if not dish_id:
                        continue
                    feature_maps[category][dish_id] = dict_to_features(dish)

    # If vegetarian table is missing, allow vegetarian requests to use veg data.
    if missing_tables.get("vegetarian") and feature_maps.get("veg"):
        feature_maps["vegetarian"] = dict(feature_maps["veg"])

    total_count = sum(category_counts.values())
    missing_categories = [key for key, missing in missing_tables.items() if missing]
    return feature_maps, category_counts, total_count, missing_categories
