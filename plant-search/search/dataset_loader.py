from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

from psycopg2.extras import RealDictCursor

from db import get_db_connection
from engine.extractor import CATEGORY_TABLES, TRANSITION_CATEGORY_KEYS


@dataclass
class DatasetDish:
    dish_id: str
    name: str
    category: str
    dataset: str
    table_name: str
    price_range: str
    protein: str
    availability: str
    ingredients: List[str] = field(default_factory=list)


@dataclass
class DatasetOption:
    category: str
    dataset: str
    table_name: str
    dish_count: int


@dataclass
class DatasetCatalog:
    datasets: List[DatasetOption]
    dishes_by_dataset: Dict[str, List[DatasetDish]]
    dishes_by_name: Dict[str, Dict[str, DatasetDish]]
    dataset_to_category: Dict[str, str]


def _normalize_name(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", " ", (value or "").strip().lower())
    return re.sub(r"\s+", " ", normalized).strip()


def _clean_ingredient(value: str) -> str:
    text = (value or "").lower()
    text = re.sub(r"\([^)]*\)", " ", text)
    text = re.sub(r"\b\d+[\d\s\./-]*\b", " ", text)
    text = re.sub(r"\b(kg|g|gram|grams|ml|l|tbsp|tsp|cup|cups|oz|lb|lbs|pinch|teaspoon|tablespoon)\b", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_ingredients(data_payload: Any) -> List[str]:
    if not isinstance(data_payload, dict):
        return []
    raw_ingredients = data_payload.get("ingredients")
    if not isinstance(raw_ingredients, list):
        return []

    values: List[str] = []
    seen: Set[str] = set()
    for raw in raw_ingredients:
        if isinstance(raw, str):
            cleaned = _clean_ingredient(raw)
        elif isinstance(raw, dict):
            cleaned = _clean_ingredient(
                str(raw.get("item") or raw.get("name") or raw.get("ingredient") or "")
            )
        else:
            cleaned = ""

        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            values.append(cleaned)

    return values


def load_dataset_catalog_from_db() -> DatasetCatalog:
    datasets: List[DatasetOption] = []
    dishes_by_dataset: Dict[str, List[DatasetDish]] = {}
    dishes_by_name: Dict[str, Dict[str, DatasetDish]] = {}
    dataset_to_category: Dict[str, str] = {}

    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            for category in TRANSITION_CATEGORY_KEYS:
                table_name = CATEGORY_TABLES[category]
                cursor.execute("SELECT to_regclass(%s) AS table_ref", (f"public.{table_name}",))
                exists_row = cursor.fetchone() or {}
                if not exists_row.get("table_ref"):
                    continue

                cursor.execute(
                    f"""
                    SELECT id, name, price_range, availability, nutrition, data
                    FROM {table_name}
                    ORDER BY name
                    """
                )
                rows = cursor.fetchall()

                dataset_key = table_name
                dataset_to_category[dataset_key] = category
                dishes_by_dataset[dataset_key] = []
                dishes_by_name[dataset_key] = {}

                for row in rows:
                    nutrition = row.get("nutrition") or {}
                    dish = DatasetDish(
                        dish_id=row.get("id") or "",
                        name=row.get("name") or "",
                        category=category,
                        dataset=dataset_key,
                        table_name=table_name,
                        price_range=row.get("price_range") or "",
                        protein=str(nutrition.get("protein") or "").lower(),
                        availability=row.get("availability") or "",
                        ingredients=_extract_ingredients(row.get("data")),
                    )
                    if not dish.dish_id or not dish.name:
                        continue
                    dishes_by_dataset[dataset_key].append(dish)
                    dishes_by_name[dataset_key][_normalize_name(dish.name)] = dish

                datasets.append(
                    DatasetOption(
                        category=category,
                        dataset=dataset_key,
                        table_name=table_name,
                        dish_count=len(dishes_by_dataset[dataset_key]),
                    )
                )

    return DatasetCatalog(
        datasets=datasets,
        dishes_by_dataset=dishes_by_dataset,
        dishes_by_name=dishes_by_name,
        dataset_to_category=dataset_to_category,
    )


def find_dish_in_dataset(catalog: DatasetCatalog, dataset: str, dish_name: str) -> Optional[DatasetDish]:
    dataset_map = catalog.dishes_by_name.get(dataset, {})
    return dataset_map.get(_normalize_name(dish_name))
