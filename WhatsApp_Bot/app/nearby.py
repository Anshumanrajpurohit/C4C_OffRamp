from __future__ import annotations

import os
import time
from typing import Any, Dict, Iterable, List, Optional, Tuple
from urllib.parse import quote_plus

import httpx

API_URL = "https://api.scrapingdog.com/google_maps"
REQUEST_TIMEOUT = 20.0
SEARCH_RADIUS_KM = 5
CACHE_TTL_SECONDS = 300
CACHE_MAX_ITEMS = 64

_CACHE: Dict[Tuple[str, str, str, str], Tuple[float, List[Dict[str, Any]]]] = {}


class NearbySearchError(RuntimeError):
    pass


def _clean_location(value: str) -> str:
    return value.strip().strip(".,;:!?")


def _to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _extract_candidates(data: Any) -> List[Dict[str, Any]]:
    if isinstance(data, list):
        return [x for x in data if isinstance(x, dict)]
    if not isinstance(data, dict):
        return []

    common_keys = (
        "search_results",
        "local_results",
        "maps_results",
        "places_results",
        "places",
        "results",
        "data",
        "organic_results",
    )
    for key in common_keys:
        value = data.get(key)
        if isinstance(value, list):
            return [x for x in value if isinstance(x, dict)]

    found: List[Dict[str, Any]] = []

    def walk(node: Any, depth: int = 0) -> None:
        if depth > 4:
            return
        if isinstance(node, list):
            for item in node:
                walk(item, depth + 1)
            return
        if not isinstance(node, dict):
            return
        if any(k in node for k in ("title", "name", "address", "place_id")):
            found.append(node)
        for value in node.values():
            if isinstance(value, (list, dict)):
                walk(value, depth + 1)

    walk(data)
    return found


def _build_maps_url(item: Dict[str, Any], name: str, address: Optional[str]) -> str:
    maps_url = (
        item.get("maps_url")
        or item.get("google_maps_url")
        or item.get("maps_link")
        or item.get("link")
    )
    if maps_url:
        return str(maps_url).strip()

    place_id = item.get("place_id")
    query = quote_plus(" ".join(x for x in (name, address or "") if x).strip() or "vegetarian restaurant")
    if place_id:
        return f"https://www.google.com/maps/search/?api=1&query={query}&query_place_id={place_id}"
    return f"https://www.google.com/maps/search/?api=1&query={query}"


def _normalize_item(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    name = (
        item.get("title")
        or item.get("name")
        or item.get("business_name")
        or item.get("place_name")
    )
    if not name:
        return None

    address = item.get("address") or item.get("full_address") or item.get("street_address")
    phone = item.get("phone") or item.get("phone_number") or item.get("contact_number")
    website = item.get("website") or item.get("site") or item.get("domain")
    rating = _to_float(item.get("rating") or item.get("stars") or item.get("rating_value"))
    maps_url = _build_maps_url(item, str(name).strip(), str(address).strip() if address else None)

    return {
        "name": str(name).strip(),
        "rating": rating,
        "address": str(address).strip() if address else None,
        "phone": str(phone).strip() if phone else None,
        "website": str(website).strip() if website else None,
        "maps_url": maps_url,
    }


def _dedupe(items: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    deduped: List[Dict[str, Any]] = []
    seen: set[Tuple[str, str]] = set()
    for item in items:
        key = (
            str(item.get("name") or "").strip().lower(),
            str(item.get("address") or "").strip().lower(),
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def _cache_get(key: Tuple[str, str, str, str]) -> Optional[List[Dict[str, Any]]]:
    entry = _CACHE.get(key)
    if not entry:
        return None
    ts, value = entry
    if time.time() - ts > CACHE_TTL_SECONDS:
        _CACHE.pop(key, None)
        return None
    return list(value)


def _cache_set(key: Tuple[str, str, str, str], value: List[Dict[str, Any]]) -> None:
    if len(_CACHE) >= CACHE_MAX_ITEMS:
        oldest_key = min(_CACHE.items(), key=lambda kv: kv[1][0])[0]
        _CACHE.pop(oldest_key, None)
    _CACHE[key] = (time.time(), list(value))


def _request_maps(api_key: str, query: str, target_count: int, country: str) -> List[Dict[str, Any]]:
    all_results: List[Dict[str, Any]] = []
    # Scrapingdog Google Maps page uses offsets (0, 20, ...). Start with 0.
    pages = (0,)

    with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
        for page in pages:
            params: Dict[str, str] = {
                "api_key": api_key,
                "query": query,
                "country": country,
                "language": "en",
                "type": "search",
                "page": str(page),
            }
            try:
                resp = client.get(API_URL, params=params)
            except httpx.HTTPError as error:
                raise NearbySearchError(f"Nearby search request failed: {error}") from error

            if resp.status_code in (401, 403):
                raise NearbySearchError("Nearby search auth failed. Check SCRAPINGDOG_API_KEY.")
            if resp.status_code == 429:
                raise NearbySearchError("Nearby search rate limit reached. Please retry in a bit.")
            if resp.status_code != 200:
                raise NearbySearchError(f"Nearby search failed with HTTP {resp.status_code}.")

            try:
                payload = resp.json()
            except ValueError:
                raise NearbySearchError("Nearby search returned a non-JSON response.")

            if isinstance(payload, dict):
                api_error = payload.get("error") or payload.get("message") or payload.get("detail")
                if api_error:
                    raise NearbySearchError(f"Nearby search API error: {str(api_error).strip()}")

            candidates = _extract_candidates(payload)
            if not candidates:
                break

            normalized = [x for x in (_normalize_item(c) for c in candidates) if x]
            if not normalized:
                break

            all_results.extend(normalized)
            all_results = _dedupe(all_results)
            if len(all_results) >= target_count:
                break

    return all_results


def _build_query(location: str, diet: Optional[str], restrictions: Iterable[str], budget: Optional[str]) -> str:
    diet_value = (diet or "").strip().lower()
    restriction_set = {str(x).strip().lower() for x in restrictions}
    budget_value = (budget or "").strip().lower()

    if diet_value == "vegan":
        diet_term = "vegan restaurant"
    elif "jain" in restriction_set:
        diet_term = "jain friendly vegetarian restaurant"
    else:
        diet_term = "vegetarian restaurant"

    budget_term = ""
    if budget_value == "low":
        budget_term = "cheap "
    elif budget_value == "premium":
        budget_term = "fine dining "

    return f"{budget_term}{diet_term} in {location}".strip()


def _build_query_variants(
    location: str,
    diet: Optional[str],
    restrictions: Iterable[str],
    budget: Optional[str],
) -> List[str]:
    location_value = _clean_location(location)
    restriction_set = {str(x).strip().lower() for x in restrictions}
    diet_value = (diet or "").strip().lower()

    variants = [
        _build_query(location_value, diet, restriction_set, budget),
    ]
    if "jain" in restriction_set:
        variants.append(f"jain vegetarian restaurants in {location_value}")
    if diet_value == "vegan":
        variants.append(f"vegan restaurants in {location_value}")
    else:
        variants.append(f"vegetarian restaurants in {location_value}")
    variants.append(f"plant based restaurants in {location_value}")
    variants.append(f"restaurants in {location_value}")

    deduped: List[str] = []
    seen: set[str] = set()
    for query in variants:
        normalized = query.strip().lower()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        deduped.append(query.strip())
    return deduped


def fetch_nearby_restaurants(
    location: str,
    *,
    diet: Optional[str],
    restrictions: Iterable[str],
    budget: Optional[str],
    limit: int = 5,
) -> List[Dict[str, Any]]:
    api_key = os.getenv("SCRAPINGDOG_API_KEY", "").strip()
    if not api_key:
        raise NearbySearchError("Nearby search is not configured (missing SCRAPINGDOG_API_KEY).")

    area = _clean_location(location or "")
    if not area:
        return []

    country = (os.getenv("SCRAPINGDOG_COUNTRY", "in").strip().lower() or "in")
    normalized_restrictions = sorted({str(x).strip().lower() for x in restrictions if str(x).strip()})
    target = max(3, min(10, int(limit) if isinstance(limit, int) else 5))

    query_variants = _build_query_variants(area, diet, normalized_restrictions, budget)
    restriction_key = ",".join(normalized_restrictions)
    cache_key = (area.lower(), (diet or "").lower(), (budget or "").lower(), restriction_key)
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached[:target]

    merged: List[Dict[str, Any]] = []
    for query in query_variants:
        chunk = _request_maps(api_key, query, target, country)
        merged = _dedupe(merged + chunk)
        if len(merged) >= target:
            break

    quality = sum(1 for r in merged if r.get("address") or r.get("phone") or r.get("website"))
    low_quality = len(merged) < max(3, target // 2) or quality < min(2, len(merged))
    if low_quality:
        fallback_query = f"restaurants in {area}"
        secondary = _request_maps(api_key, fallback_query, target, country)
        merged = _dedupe(merged + secondary)

    if any(r.get("rating") is not None for r in merged):
        merged.sort(
            key=lambda x: (
                x.get("rating") is not None,
                x.get("rating") if x.get("rating") is not None else -1.0,
            ),
            reverse=True,
        )

    final_results = merged[:target]
    _cache_set(cache_key, final_results)
    return final_results
