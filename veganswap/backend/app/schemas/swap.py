from pydantic import BaseModel
from typing import List, Optional

class SwapRequest(BaseModel):
    dish_name: str
    dietary_restrictions: Optional[List[str]] = []
    texture_preference: Optional[float] = None


class SwapSuggestion(BaseModel):
    id: int
    name: str
    score: float


class SwapResponse(BaseModel):
    original_dish: str
    suggestions: List[SwapSuggestion]
