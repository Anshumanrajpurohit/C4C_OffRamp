"""Recipes API router."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import SessionLocal, get_db
from ..models import Recipe
from ..repositories import RecipeRepository
from ..schemas import RecipeCreate, RecipeFilterRequest, RecipeResponse
from ..services.ranker import rank_recipes
from ..services.selector import select_candidates

router = APIRouter(prefix="/recipes", tags=["recipes"])
repository = RecipeRepository(SessionLocal)


def _recipe_to_response(recipe: Recipe) -> RecipeResponse:
    return RecipeResponse.model_validate(recipe, from_attributes=True)


@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(payload: RecipeCreate, db: Session = Depends(get_db)) -> RecipeResponse:
    data = payload.model_dump()
    texture_score = data.pop("texture_score", None)
    texture_match = dict(data.get("texture_match") or {})
    data["texture_match"] = texture_match
    if texture_score is not None:
        texture_match.setdefault("similarity_score", texture_score)

    recipe = Recipe(**data)
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    repository.clear_cache()
    return _recipe_to_response(recipe)


@router.get("/", response_model=List[RecipeResponse])
def list_recipes(diet: str | None = None, limit: int = 50, skip: int = 0) -> List[RecipeResponse]:
    records = repository.get_all(diet)
    sliced = records[skip : skip + limit]
    return [_recipe_to_response(recipe) for recipe in sliced]


@router.post("/filter", response_model=List[RecipeResponse])
def filter_recipes(
    payload: RecipeFilterRequest,
    db: Session = Depends(get_db),
) -> List[RecipeResponse]:
    candidates = select_candidates(
        db,
        diet=payload.diet,
        dietary_restrictions=payload.dietary_restrictions,
        include_ingredients=payload.include_ingredients,
        exclude_ingredients=payload.exclude_ingredients,
    )

    ranked = rank_recipes(
        candidates,
        reference_ingredients=(
            payload.reference_ingredients or payload.include_ingredients
        ),
    )
    top_candidates = [recipe for recipe, _ in ranked[: payload.limit]]
    return [_recipe_to_response(recipe) for recipe in top_candidates]


@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe(recipe_id: int) -> RecipeResponse:
    recipe = repository.find_by_id(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return _recipe_to_response(recipe)
