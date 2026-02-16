from __future__ import annotations

from typing import Dict, List, Any

from . import DishFeatures, NutritionProfile, TasteProfile


def _to_lower(value: str) -> str:
    return value.lower() if isinstance(value, str) else value


def _normalize_list(values: List[str]) -> List[str]:
    if values is None:
        return []
    return [v.lower() for v in values if v]


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
        category=dish_dict["category"],
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


def load_vegan_feature_map(vegan_dishes: List[Dict[str, Any]]) -> Dict[str, DishFeatures]:
    """Convert list of vegan dish dicts to feature map keyed by ID."""
    feature_map = {}
    for dish_dict in vegan_dishes:
        dish_id = dish_dict.get("id", "")
        if dish_id:
            feature_map[dish_id] = dict_to_features(dish_dict)
    return feature_map


def load_vegan_feature_map_from_db() -> Dict[str, DishFeatures]:
    """Load vegan dishes from AWS RDS database into feature map for scoring."""
    from db import get_db_connection
    from psycopg2.extras import RealDictCursor
    
    feature_map = {}
    
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    id, name, category, price_range, availability,
                    taste_features, texture_features, emotion_features, nutrition
                FROM dishes
                WHERE category = 'vegan'
                ORDER BY name
            """)
            
            vegan_dishes = cursor.fetchall()
            
            for dish in vegan_dishes:
                # Convert psycopg2 RealDictRow to regular dict
                dish_dict = dict(dish)
                dish_id = dish_dict.get("id", "")
                if dish_id:
                    feature_map[dish_id] = dict_to_features(dish_dict)
    
    return feature_map
