"""Filter logic enforcing vegetarian, vegan, and Jain rules."""
from __future__ import annotations

import re
from typing import Any, Dict, Iterable, List, Sequence, Set

IngredientList = Sequence[Dict[str, Any]]


class FilterEngine:
    """Applies dietary guardrails over the dataset."""

    MEAT_KEYWORDS: Set[str] = {
        "chicken",
        "mutton",
        "beef",
        "pork",
        "lamb",
        "turkey",
        "bacon",
        "ham",
        "duck",
        "pepperoni",
        "anchovy",
    }
    SEAFOOD_KEYWORDS: Set[str] = {
        "fish",
        "shrimp",
        "prawn",
        "crab",
        "lobster",
        "salmon",
        "tuna",
        "anchovy",
        "squid",
    }
    DAIRY_KEYWORDS: Set[str] = {
        "milk",
        "paneer",
        "cheese",
        "ghee",
        "butter",
        "yogurt",
        "curd",
        "cream",
    }
    EGG_KEYWORDS: Set[str] = {"egg", "eggs", "mayonnaise"}
    ALLIUMS: Set[str] = {"onion", "garlic", "shallot", "leek", "scallion", "chive"}
    ROOT_VEGETABLES: Set[str] = {"potato", "carrot", "turnip", "radish", "beet", "yam", "sweet potato"}

    def apply(self, recipes: List[Dict[str, Any]], diet: str) -> List[Dict[str, Any]]:
        if not diet:
            return recipes
        diet_normalized = diet.lower()
        allowed: List[Dict[str, Any]] = []
        for recipe in recipes:
            if self._matches_diet(recipe, diet_normalized):
                allowed.append(recipe)
        return allowed

    def _matches_diet(self, recipe: Dict[str, Any], diet: str) -> bool:
        tokens = self._ingredient_tokens(recipe)
        if diet in {"vegetarian", "vegan", "jain"}:
            if self._contains_any(tokens, self.MEAT_KEYWORDS | self.SEAFOOD_KEYWORDS):
                return False
        if diet in {"vegan", "jain"}:
            if self._contains_any(tokens, self.DAIRY_KEYWORDS | self.EGG_KEYWORDS):
                return False
        if diet == "jain":
            if self._contains_any(tokens, self.ALLIUMS | self.ROOT_VEGETABLES):
                return False
        return True

    def _ingredient_tokens(self, recipe: Dict[str, Any]) -> Set[str]:
        tokens: Set[str] = set()
        ingredients: IngredientList = recipe.get("ingredients") or []
        for entry in ingredients:
            item = (entry.get("item") or "").lower()
            tokens.update(self._split_tokens(item))
        text_fields = " ".join(
            str(recipe.get(field, "")) for field in ("name", "heroSummary", "whyItWorks", "categories")
        ).lower()
        tokens.update(self._split_tokens(text_fields))
        return tokens

    @staticmethod
    def _split_tokens(value: str) -> Set[str]:
        return {token for token in re.split(r"[^a-zA-Z]+", value) if token}

    @staticmethod
    def _contains_any(tokens: Set[str], banned: Set[str]) -> bool:
        return any(token in banned for token in tokens)
