from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request, status
from psycopg2.extras import RealDictCursor, Json

from db import get_db_connection
from engine.extractor import dict_to_dish_response, dict_to_features
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
    
    # Find source dish in database (non-vegan)
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, name, category, price_range, availability,
                       taste_features, texture_features, emotion_features, nutrition
                FROM dishes
                WHERE LOWER(name) = LOWER(%s) AND category = 'non-vegan'
                LIMIT 1
            """, (payload.dish_name,))
            
            source_dish = cursor.fetchone()
    
    if not source_dish:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dish not found")
    
    # Convert to features
    source_features = dict_to_features(dict(source_dish))
    
    # Get cached vegan feature map from app state
    vegan_map = getattr(request.app.state, "vegan_feature_map", {})
    
    if not vegan_map:
        return []
    
    # Score and rank
    score_map = score_all(source_features, vegan_map)
    candidate_count = len(vegan_map)
    ranked_full = rank_top_matches(score_map, vegan_map, candidate_count)
    
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
    
    # If vegan dish, update cached feature map
    if payload.category == "vegan":
        vegan_map = getattr(request.app.state, "vegan_feature_map", {})
        vegan_map[dish_dict["id"]] = dict_to_features(dish_dict["data"])
        request.app.state.vegan_feature_map = vegan_map
    
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
            
            category = result[0]
            
            # Delete the dish
            cursor.execute("DELETE FROM dishes WHERE id = %s", (dish_id,))
            conn.commit()
    
    # If vegan dish, update cached feature map
    if category == "vegan":
        vegan_map = getattr(request.app.state, "vegan_feature_map", {})
        vegan_map.pop(dish_id, None)
        request.app.state.vegan_feature_map = vegan_map
    
    return DeleteResponse(status="deleted", deleted_id=dish_id)


@router.get("/dishes", response_model=List[DishSummary])
async def list_dishes(
    category: Optional[str] = Query(None, pattern="^(vegan|non-vegan)$"),
    protein: Optional[str] = None,
    price_range: Optional[str] = None,
    name: Optional[str] = Query(None, min_length=1),
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