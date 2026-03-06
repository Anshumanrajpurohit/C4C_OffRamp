#!/usr/bin/env python3
"""
Thin bridge from OffRamp to plant-search.
Reads JSON payload from stdin and writes JSON to stdout.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any

DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_TIMEOUT = 20


def _read_payload() -> dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("Payload must be a JSON object.")
    return data


def _normalize_reasons(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        if isinstance(item, str):
            text = item.strip()
            if text:
                out.append(text)
    return out


def _normalize_ingredients(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        if isinstance(item, str):
            text = item.strip()
            if text:
                out.append(text)
    return out


def _post_search(base_url: str, payload: dict[str, Any], timeout_seconds: int) -> list[dict[str, Any]]:
    endpoint = f"{base_url.rstrip('/')}/search"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout_seconds) as response:
        raw = response.read().decode("utf-8")
    parsed = json.loads(raw) if raw else []
    if isinstance(parsed, list):
        return [item for item in parsed if isinstance(item, dict)]
    return []


def main() -> int:
    try:
        incoming = _read_payload()
        dish_query = incoming.get("dish_query") or incoming.get("dish_name") or incoming.get("query")
        if not isinstance(dish_query, str) or not dish_query.strip():
            print(json.dumps({"error": "dish_query is required"}))
            return 2

        from_dataset = incoming.get("from_dataset")
        to_dataset = incoming.get("to_dataset")
        top_n = incoming.get("top_n") or 9

        plant_payload: dict[str, Any] = {
            "dish_name": dish_query.strip(),
            "top_n": int(top_n),
            "from_dataset": from_dataset,
            "to_dataset": to_dataset,
        }

        # Pass through optional ranking hints if provided by OffRamp.
        for key in ("from", "to", "from_category", "to_category", "protein_level", "price_level", "sort_by"):
            value = incoming.get(key)
            if value is not None:
                plant_payload[key] = value

        base_url = (os.getenv("PLANT_SEARCH_API_BASE_URL") or DEFAULT_BASE_URL).strip()
        timeout_seconds = int(os.getenv("SEARCH_BRIDGE_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT)))
        rows = _post_search(base_url, plant_payload, timeout_seconds)

        results: list[dict[str, Any]] = []
        for row in rows:
            score = row.get("score")
            similarity = row.get("similarity", score)
            results.append(
                {
                    "dish_id": row.get("dish_id"),
                    "name": row.get("name"),
                    "dish_name": row.get("name"),
                    "protein": row.get("protein"),
                    "price_range": row.get("price_range"),
                    "price": row.get("price_range"),
                    "availability": row.get("availability"),
                    "score": score,
                    "similarity": similarity,
                    "similarity_score": similarity,
                    "matched_ingredients": _normalize_ingredients(row.get("matched_ingredients")),
                    "reasons": _normalize_reasons(row.get("reasons")),
                    "from_dataset": row.get("from_dataset"),
                    "to_dataset": row.get("to_dataset"),
                }
            )

        print(
            json.dumps(
                {
                    "from_dataset": from_dataset,
                    "to_dataset": to_dataset,
                    "query": dish_query.strip(),
                    "results": results,
                }
            )
        )
        return 0
    except urllib.error.HTTPError as exc:
        message = exc.read().decode("utf-8", errors="replace")
        print(json.dumps({"error": message or str(exc), "status": exc.code}))
        return 1
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

