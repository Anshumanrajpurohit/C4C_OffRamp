from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request, status
from psycopg2.extras import RealDictCursor, Json

from db import get_db_connection
from engine.extractor import (
    TRANSITION_CATEGORY_KEYS,
    dict_to_dish_response,
    dict_to_features,
    normalize_transition_category,
)
from engine.ranker import rank_top_matches
from engine.scorer import score_all

from .models import (
    DeleteResponse,
    DishCreate,
    DishResponse,
    DishSummary,
    HealthResponse,
    SearchRequest,
    SearchResult,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _normalize_transition_value(value: Optional[str]) -> Optional[str]:
    if not isinstance(value, str):
        return None
    normalized = value.strip().lower()
    if not normalized:
        return None
    if normalized in {"nonveg", "non_veg"}:
        return "non-vegan"
    if normalized == "vegeterian":
        return "vegetarian"
    if normalized in {"non-vegan", "veg", "vegetarian", "vegan", "jain", "keto"}:
        return normalized
    return None


def _matches_transition_target(candidate_category: str, to_value: Optional[str]) -> bool:
    if not to_value:
        return True
    candidate = normalize_transition_category(candidate_category)
    target = _normalize_transition_value(to_value)
    if not target:
        return True
    return candidate == target


def _get_feature_maps(request: Request) -> Dict[str, Dict[str, Any]]:
    feature_maps = getattr(request.app.state, "feature_maps", None)
    if isinstance(feature_maps, dict) and feature_maps:
        return feature_maps
    legacy_vegan_map = getattr(request.app.state, "vegan_feature_map", {})
    fallback = {key: {} for key in TRANSITION_CATEGORY_KEYS}
    if isinstance(legacy_vegan_map, dict):
        fallback["vegan"] = legacy_vegan_map
    return fallback


def _get_missing_feature_map_categories(request: Request) -> set[str]:
    missing = getattr(request.app.state, "missing_feature_map_categories", None)
    if isinstance(missing, set):
        return missing
    return set()


def _normalize_dish_name(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", " ", value.strip().lower())
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def _find_source_feature(source_map: Dict[str, Any], dish_name: str, source_category: str):
    normalized_target = _normalize_dish_name(dish_name)
    if not normalized_target:
        logger.info(
            "source lookup miss: requested='%s' normalized='%s' from='%s' fallback_used=false reason='empty-normalized'",
            dish_name,
            normalized_target,
            source_category,
        )
        return None

    candidates: List[tuple[Any, str, str]] = []
    for feature in source_map.values():
        raw_name = getattr(feature, "name", "")
        normalized_name = _normalize_dish_name(raw_name)
        if not normalized_name:
            continue
        candidates.append((feature, normalized_name, raw_name))

    for feature, normalized_name, _ in candidates:
        if normalized_name == normalized_target:
            return feature

    best_feature = None
    best_name = ""
    best_score = 0.0
    best_method = ""

    for feature, normalized_name, raw_name in candidates:
        if normalized_target in normalized_name or normalized_name in normalized_target:
            ratio = SequenceMatcher(None, normalized_target, normalized_name).ratio()
            score = ratio + 0.15
            if score > best_score:
                best_feature = feature
                best_name = raw_name
                best_score = score
                best_method = "substring"

    if best_feature and best_score >= 0.70:
        logger.info(
            "source lookup fallback: requested='%s' normalized='%s' from='%s' fallback_used=true matched='%s' method='%s' score=%.3f",
            dish_name,
            normalized_target,
            source_category,
            best_name,
            best_method,
            best_score,
        )
        return best_feature

    for feature, normalized_name, raw_name in candidates:
        score = SequenceMatcher(None, normalized_target, normalized_name).ratio()
        if score > best_score:
            best_feature = feature
            best_name = raw_name
            best_score = score
            best_method = "similarity"

    if best_feature and best_score >= 0.78:
        logger.info(
            "source lookup fallback: requested='%s' normalized='%s' from='%s' fallback_used=true matched='%s' method='%s' score=%.3f",
            dish_name,
            normalized_target,
            source_category,
            best_name,
            best_method,
            best_score,
        )
        return best_feature

    logger.info(
        "source lookup miss: requested='%s' normalized='%s' from='%s' fallback_used=false best_method='%s' best_score=%.3f",
        dish_name,
        normalized_target,
        source_category,
        best_method or "none",
        best_score,
    )
    return None


def _resolve_category_map(feature_maps: Dict[str, Dict[str, Any]], category: str) -> Dict[str, Any]:
    dataset = feature_maps.get(category, {})
    if dataset:
        return dataset
    if category == "vegetarian":
        return feature_maps.get("veg", {})
    return dataset


def _dish_to_db_dict(dish: DishCreate) -> Dict[str, Any]:
    """Convert DishCreate model to dictionary for database insertion."""
    dish_id = dish.id or str(uuid.uuid4())
    
    taste_features = {
        "umami_depth": {
            "level": dish.taste_features.umami_depth.level,
            "source": dish.taste_features.umami_depth.source,
        },
        "seasoning_profile": {
            "salt_level": dish.taste_features.seasoning_profile.salt_level,
            "sweet_level": dish.taste_features.seasoning_profile.sweet_level,
            "sour_level": dish.taste_features.seasoning_profile.sour_level,
            "bitter_level": dish.taste_features.seasoning_profile.bitter_level,
            "spice_heat": dish.taste_features.seasoning_profile.spice_heat,
        },
        "flavor_base": {
            "primary": dish.taste_features.flavor_base.primary,
            "secondary": dish.taste_features.flavor_base.secondary,
        },
        "taste_intensity": {
            "overall": dish.taste_features.taste_intensity.overall,
            "complexity": dish.taste_features.taste_intensity.complexity,
        },
        "aftertaste": {
            "type": dish.taste_features.aftertaste.type,
            "duration": dish.taste_features.aftertaste.duration,
        },
    }
    
    nutrition = {
        "protein": dish.nutrition.protein,
        "energy": dish.nutrition.energy,
        "fat": dish.nutrition.fat,
    }
    
    # Full data object (combines all fields)
    data = {
        "id": dish_id,
        "name": dish.name,
        "category": dish.category,
        "taste_features": taste_features,
        "texture_features": dish.texture_features,
        "emotion_features": dish.emotion_features,
        "nutrition": nutrition,
        "price_range": dish.price_range,
        "availability": dish.availability,
        "created_at": datetime.now().isoformat(),
    }
    
    return {
        "id": dish_id,
        "name": dish.name,
        "category": dish.category,
        "price_range": dish.price_range,
        "availability": dish.availability,
        "data": data,
        "taste_features": taste_features,
        "texture_features": dish.texture_features,
        "emotion_features": dish.emotion_features,
        "nutrition": nutrition,
    }


@router.post("/search", response_model=List[SearchResult])
async def search_dishes(request: Request, payload: SearchRequest) -> List[SearchResult]:
    """Search for vegan alternatives to a non-vegan dish using AWS RDS database."""
    top_n_default = getattr(request.app.state, "top_n_default", 10)
    top_n = payload.top_n or top_n_default
    from_value = _normalize_transition_value(payload.from_)
    to_value = _normalize_transition_value(payload.to)

    feature_maps = _get_feature_maps(request)
    missing_categories = _get_missing_feature_map_categories(request)

    source_category = from_value or "non-vegan"
    source_map = _resolve_category_map(feature_maps, source_category)
    if from_value and not source_map and from_value in missing_categories:
        source_map = _resolve_category_map(feature_maps, "non-vegan")
    source_features = _find_source_feature(source_map, payload.dish_name, source_category)
    if not source_features:
        return []

    if to_value:
        filtered_map = _resolve_category_map(feature_maps, to_value)
        if not filtered_map and to_value in missing_categories:
            filtered_map = {}
            for key, dataset in feature_maps.items():
                if key == "non-vegan":
                    continue
                filtered_map.update(dataset)
    else:
        # Preserve old behavior: if no `to` is provided, score against the full plant-forward pool.
        filtered_map = {}
        for key, dataset in feature_maps.items():
            if key == "non-vegan":
                continue
            filtered_map.update(dataset)

    if not filtered_map:
        return []
    
    # Score and rank
    score_map = score_all(source_features, filtered_map)
    candidate_count = len(filtered_map)
    ranked_full = rank_top_matches(score_map, filtered_map, candidate_count)
    
    return [SearchResult(**item) for item in ranked_full[:top_n]]


@router.get("/dish/{name}", response_model=DishResponse)
async def get_dish(name: str) -> DishResponse:
    """Get a single dish by name from AWS RDS database."""
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT id, name, category, price_range, availability,
                       taste_features, texture_features, emotion_features, nutrition,
                       created_at, data
                FROM dishes
                WHERE LOWER(name) = LOWER(%s)
                LIMIT 1
                """,
                (name,),
            )
            
            dish = cursor.fetchone()
    
    if not dish:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dish not found")
    
    return dict_to_dish_response(dict(dish))


@router.post("/dish/add", response_model=DishResponse, status_code=status.HTTP_201_CREATED)
async def add_dish(request: Request, payload: DishCreate) -> DishResponse:
    """Add a new dish to AWS RDS database."""
    
    # Check for duplicate name
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM dishes WHERE LOWER(name) = LOWER(%s)",
                (payload.name,)
            )
            if cursor.fetchone()[0] > 0:
                raise HTTPException(status.HTTP_409_CONFLICT, "Dish with that name already exists")
    
    # Convert to database format
    dish_dict = _dish_to_db_dict(payload)
    
    # Insert into database
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                INSERT INTO dishes (
                    id, name, category, price_range, availability,
                    data, taste_features, texture_features, emotion_features, nutrition,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                RETURNING id, name, category, price_range, availability,
                          taste_features, texture_features, emotion_features, nutrition,
                          created_at, data
                """,
                (
                    dish_dict["id"],
                    dish_dict["name"],
                    dish_dict["category"],
                    dish_dict["price_range"],
                    dish_dict["availability"],
                    Json(dish_dict["data"]),
                    Json(dish_dict["taste_features"]),
                    Json(dish_dict["texture_features"]),
                    Json(dish_dict["emotion_features"]),
                    Json(dish_dict["nutrition"]),
                ),
            )
            
            new_dish = cursor.fetchone()
            conn.commit()
    
    # Update in-memory feature maps cache.
    feature_maps = _get_feature_maps(request)
    transition_category = normalize_transition_category(dish_dict["data"].get("diet") or dish_dict["category"])
    feature_maps.setdefault(transition_category, {})
    feature_maps[transition_category][dish_dict["id"]] = dict_to_features(
        {**dish_dict, "category": transition_category}
    )
    request.app.state.feature_maps = feature_maps
    
    return dict_to_dish_response(dict(new_dish))


@router.delete("/dish/{dish_id}", response_model=DeleteResponse)
async def delete_dish(dish_id: str, request: Request) -> DeleteResponse:
    """Delete a dish from AWS RDS database."""
    
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Check if dish exists and get its category
            cursor.execute("SELECT category FROM dishes WHERE id = %s", (dish_id,))
            result = cursor.fetchone()
            
            if not result:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Dish not found")
            
            # Delete the dish
            cursor.execute("DELETE FROM dishes WHERE id = %s", (dish_id,))
            conn.commit()
    
    # Remove from all in-memory feature maps cache entries.
    feature_maps = _get_feature_maps(request)
    for dataset in feature_maps.values():
        if isinstance(dataset, dict):
            dataset.pop(dish_id, None)
    request.app.state.feature_maps = feature_maps
    
    return DeleteResponse(status="deleted", deleted_id=dish_id)


@router.get("/dishes", response_model=List[DishSummary])
async def list_dishes(
    category: Optional[str] = Query(None, pattern="^(vegan|non-vegan)$"),
    protein: Optional[str] = None,
    price_range: Optional[str] = None,
    name: Optional[str] = Query(None, min_length=1),
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = Query(None),
) -> List[DishSummary]:
    """List dishes with optional filtering from AWS RDS database."""
    
    # Build dynamic query
    query = """
        SELECT id, name, category, price_range, nutrition->>'protein' as protein
        FROM dishes
        WHERE 1=1
    """
    params = []
    
    if category:
        query += " AND category = %s"
        params.append(category)

    from_value = _normalize_transition_value(from_)
    to_value = _normalize_transition_value(to)
    if from_value:
        if from_value == "non-vegan":
            query += " AND category = 'non-vegan'"
        else:
            query += """
            AND category = 'vegan'
            AND (
              CASE
                WHEN LOWER(COALESCE(NULLIF(data->>'diet', ''), 'vegan')) = 'veg' THEN 'veg'
                WHEN LOWER(COALESCE(NULLIF(data->>'diet', ''), 'vegan')) IN ('vegetarian', 'vegeterian') THEN 'vegetarian'
                WHEN LOWER(COALESCE(NULLIF(data->>'diet', ''), 'vegan')) IN ('vegan', 'jain', 'keto') THEN LOWER(COALESCE(NULLIF(data->>'diet', ''), 'vegan'))
                ELSE 'vegan'
              END
            ) = %s
          """
            params.append(from_value)

    if to_value:
        if to_value == "non-vegan":
            query += " AND category = 'non-vegan'"
        else:
            query += """
            AND category = 'vegan'
            AND (
              CASE
                WHEN LOWER(COALESCE(NULLIF(data->>'diet', ''), 'vegan')) = 'veg' THEN 'veg'
                WHEN LOWER(COALESCE(NULLIF(data->>'diet', ''), 'vegan')) IN ('vegetarian', 'vegeterian') THEN 'vegetarian'
                WHEN LOWER(COALESCE(NULLIF(data->>'diet', ''), 'vegan')) IN ('vegan', 'jain', 'keto') THEN LOWER(COALESCE(NULLIF(data->>'diet', ''), 'vegan'))
                ELSE 'vegan'
              END
            ) = %s
          """
            params.append(to_value)
    
    if protein:
        query += " AND nutrition->>'protein' = %s"
        params.append(protein)
    
    if price_range:
        query += " AND price_range = %s"
        params.append(price_range)
    
    if name:
        query += " AND LOWER(name) LIKE LOWER(%s)"
        params.append(f"{name}%")
    
    query += " ORDER BY name LIMIT 50"
    
    # Execute query
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, tuple(params))
            dishes = cursor.fetchall()
    
    # Convert to response model
    return [
        DishSummary(
            id=dish["id"],
            name=dish["name"],
            category=dish["category"],
            price_range=dish["price_range"],
            protein=dish["protein"],
        )
        for dish in dishes
    ]


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint with database dish count from AWS RDS."""
    
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM dishes")
            total_count = cursor.fetchone()[0]
    
    return HealthResponse(status="ok", dish_count=total_count)
