"""Centralized utilities for reading and writing the recipe dataset safely."""
from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional


class DataLoader:
    """Loads and updates the canonical recipe dataset."""

    METADATA_SLUGS = {"recipes"}

    def __init__(self, data_path: Path) -> None:
        self._data_path = data_path
        self._lock = Lock()
        if not self._data_path.exists():
            raise FileNotFoundError(f"Dataset not found at {self._data_path}")

    def _read_raw(self) -> List[Dict[str, Any]]:
        with self._data_path.open(encoding="utf-8") as handle:
            return json.load(handle)

    def _write_raw(self, payload: List[Dict[str, Any]]) -> None:
        temp_path = self._data_path.with_suffix(".tmp")
        with temp_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2, ensure_ascii=False)
        temp_path.replace(self._data_path)

    def load_recipes(self) -> List[Dict[str, Any]]:
        """Returns dataset entries excluding metadata placeholders."""
        return [entry for entry in self._read_raw() if entry.get("slug") not in self.METADATA_SLUGS]

    def get_recipe(self, slug_or_name: str) -> Optional[Dict[str, Any]]:
        """Fetches a recipe by slug or by exact name (case-insensitive)."""
        needle = slug_or_name.strip().lower()
        for recipe in self.load_recipes():
            slug = (recipe.get("slug") or "").lower()
            name = (recipe.get("name") or "").lower()
            if needle in {slug, name}:
                return recipe
        return None

    def persist_recipe(self, name: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Atomically updates a recipe by name and returns the updated entry."""
        with self._lock:
            payload = self._read_raw()
            updated_entry: Optional[Dict[str, Any]] = None
            for entry in payload:
                if (entry.get("name") or "").lower() == name.lower():
                    entry.update(updates)
                    updated_entry = entry
                    break
            if updated_entry is not None:
                self._write_raw(payload)
            return updated_entry
