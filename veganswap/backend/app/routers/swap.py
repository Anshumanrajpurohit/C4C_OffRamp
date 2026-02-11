from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.swap import SwapRequest, SwapResponse, SwapSuggestion
from app.services.swap_service import get_swap_suggestions

router = APIRouter(prefix="/swap", tags=["swap"])


@router.post("/", response_model=SwapResponse)
def swap_dish(request: SwapRequest, db: Session = Depends(get_db)):
    results = get_swap_suggestions(
        db,
        request.dish_name,
        request.dietary_restrictions,
        request.texture_preference,
    )

    suggestions = [
        SwapSuggestion(
            id=recipe.id,
            name=recipe.name,
            score=round(score, 3),
        )
        for recipe, score in results
    ]

    return SwapResponse(
        original_dish=request.dish_name,
        suggestions=suggestions,
    )
