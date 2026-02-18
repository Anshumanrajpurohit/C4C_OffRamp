from __future__ import annotations

import base64
import json
import mimetypes
import re
from dataclasses import dataclass
from typing import Any, Optional

import httpx

from .config import get_model_name, get_openrouter_api_key


@dataclass
class DishVisionResult:
    dish_name: str
    veg_status: str
    confidence: float
    recommendation_type: str
    recommendations: list[dict[str, str]]
    cuisine: str = ""
    evidence: list[str] | None = None


class DishVisionError(RuntimeError):
    pass


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-4o"
TEMPERATURE = 0.2
NON_VEG_PATTERN = re.compile(
    r"\b("
    r"chicken|mutton|lamb|beef|pork|bacon|ham|turkey|duck|goat|"
    r"fish|prawn|shrimp|crab|lobster|squid|octopus|anchovy|sardine|tuna|salmon|"
    r"egg|eggs|omelet|omelette|pepperoni|sausage"
    r")\b",
    re.IGNORECASE,
)


def _mime_from_filename(filename: str) -> str:
    mime, _ = mimetypes.guess_type(filename)
    if mime and mime.startswith("image/"):
        return mime
    return "image/jpeg"


def _data_url(image_bytes: bytes, filename: str) -> str:
    if not image_bytes:
        raise DishVisionError("image_bytes is empty")
    mime = _mime_from_filename(filename)
    b64 = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{mime};base64,{b64}"


def _extract_json(text: str) -> dict[str, Any]:
    raw = text.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.IGNORECASE | re.DOTALL).strip()

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            parsed = json.loads(raw[start : end + 1])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass

    raise DishVisionError("Model did not return valid JSON")


def _has_nonveg_keywords(name: str) -> bool:
    return bool(NON_VEG_PATTERN.search(name or ""))


def _fallback_recommendations(cuisine: str) -> list[dict[str, str]]:
    lowered = (cuisine or "").lower()
    if "indian" in lowered:
        return [
            {"name": "Paneer Tikka", "why": "Similar smoky char and spice-forward marinade."},
            {"name": "Chana Masala", "why": "Comparable robust masala profile and hearty texture."},
            {"name": "Vegetable Biryani", "why": "Matches aromatic spice layering and meal format."},
        ]
    if "thai" in lowered:
        return [
            {"name": "Tofu Green Curry", "why": "Keeps creamy herb-chili curry profile and heat."},
            {"name": "Pad See Ew with Tofu", "why": "Similar wok-caramelized savory noodle character."},
            {"name": "Vegetable Basil Stir-Fry", "why": "Preserves aromatic basil-garlic stir-fry style."},
        ]
    return [
        {"name": "Grilled Paneer Skewers", "why": "Offers similar charred exterior and protein-like bite."},
        {"name": "Mushroom Stroganoff", "why": "Maintains savory umami depth and creamy texture."},
        {"name": "Lentil and Vegetable Stew", "why": "Provides comparable hearty body and comfort profile."},
    ]


def _normalize_output(candidate: dict[str, Any], pass1: dict[str, Any]) -> dict[str, Any]:
    dish_candidates = pass1.get("dish_candidates") if isinstance(pass1.get("dish_candidates"), list) else []
    fallback_dish = dish_candidates[0] if dish_candidates else ""
    dish_name = str(candidate.get("dish_name") or fallback_dish).strip()

    veg_status = str(candidate.get("veg_status", "")).strip().lower()
    if veg_status not in {"veg", "non_veg", "uncertain"}:
        veg_status = str(pass1.get("veg_status", "uncertain")).strip().lower()
    if veg_status not in {"veg", "non_veg", "uncertain"}:
        veg_status = "uncertain"

    try:
        confidence = float(candidate.get("confidence", pass1.get("confidence", 0.0)))
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))

    recommendation_type = str(candidate.get("recommendation_type", "")).strip().lower()
    if recommendation_type not in {"replacement", "similar_veg"}:
        recommendation_type = "replacement" if veg_status == "non_veg" else "similar_veg"

    recommendations: list[dict[str, str]] = []
    recommendations_in = candidate.get("recommendations")
    if isinstance(recommendations_in, list):
        for item in recommendations_in:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name", "")).strip()
            why = str(item.get("why", "")).strip()
            if name and why:
                recommendations.append({"name": name, "why": why})

    if len(recommendations) < 3:
        cuisine = str(pass1.get("cuisine", "")).strip()
        for fallback in _fallback_recommendations(cuisine):
            if len(recommendations) >= 3:
                break
            recommendations.append(fallback)
    recommendations = recommendations[:3]

    return {
        "dish_name": dish_name,
        "veg_status": veg_status,
        "confidence": confidence,
        "recommendation_type": recommendation_type,
        "recommendations": recommendations,
    }


def _is_valid_output(result: dict[str, Any]) -> bool:
    if result.get("veg_status") not in {"veg", "non_veg", "uncertain"}:
        return False
    if result.get("recommendation_type") not in {"replacement", "similar_veg"}:
        return False
    confidence = result.get("confidence")
    if not isinstance(confidence, (int, float)) or not (0.0 <= float(confidence) <= 1.0):
        return False
    recommendations = result.get("recommendations")
    if not isinstance(recommendations, list) or len(recommendations) != 3:
        return False
    for recommendation in recommendations:
        if not isinstance(recommendation, dict):
            return False
        if not str(recommendation.get("name", "")).strip():
            return False
        if not str(recommendation.get("why", "")).strip():
            return False
    return True


class DishVision:
    def __init__(self, *, timeout: float = 40.0) -> None:
        self._timeout = timeout
        self._api_url = OPENROUTER_URL

    def _call_openrouter(self, messages: list[dict[str, Any]], model: str) -> str:
        headers = {
            "Authorization": f"Bearer {get_openrouter_api_key()}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://offramp.chat",
            "X-Title": "OFFRAMP Dish Wizard",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": TEMPERATURE,
            "stream": False,
        }

        try:
            timeout = httpx.Timeout(connect=10.0, read=self._timeout, write=30.0, pool=10.0)
            with httpx.Client(timeout=timeout) as client:
                response = client.post(self._api_url, headers=headers, json=payload)
        except httpx.HTTPError as exc:
            raise DishVisionError(f"OpenRouter request failed: {exc}") from exc

        if response.status_code != 200:
            raise DishVisionError(
                f"OpenRouter error {response.status_code}: {response.text[:500]}"
            )

        try:
            data = response.json()
            content = data["choices"][0]["message"]["content"]
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise DishVisionError("Malformed OpenRouter response payload") from exc

        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, dict):
                    text = item.get("text")
                    if isinstance(text, str):
                        parts.append(text)
            joined = "\n".join(parts).strip()
            if joined:
                return joined
        raise DishVisionError("Assistant content was empty or unsupported")

    def _run_pass1(self, image_bytes: bytes, filename: str, model: str) -> dict[str, Any]:
        image_url = _data_url(image_bytes, filename)
        system = "You are a high-accuracy food vision analyst. Return strict JSON only."
        user = (
            "Analyze the food image and return ONLY this JSON schema:\n"
            '{"dish_candidates":["..."],"cuisine":"...","key_ingredients_visible":["..."],'
            '"veg_status":"veg|non_veg|uncertain","confidence":0.0,"evidence":["..."]}\n'
            "Rules: egg counts as non_veg. Dairy is veg. Keep compact and grounded in visible evidence."
        )
        messages = [
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            },
        ]
        return _extract_json(self._call_openrouter(messages, model))

    def _run_pass2(self, pass1: dict[str, Any], model: str, retry: bool = False) -> dict[str, Any]:
        system = "You are a strict JSON generator for vegetarian dish recommendations."
        retry_instruction = (
            "This is a retry. Correct any previous violations strictly."
            if retry
            else "Before answering, self-check that all recommendations are strictly vegetarian."
        )
        user = (
            "Given PASS 1 JSON, generate final output JSON only.\n"
            "If veg_status is non_veg: recommendation_type must be replacement.\n"
            "If veg_status is veg or uncertain: recommendation_type must be similar_veg.\n"
            "Provide exactly 3 recommendations, each with name and short why.\n"
            "No recommendation may include egg, meat, fish, or seafood.\n"
            "Output exactly this schema:\n"
            '{"dish_name":"string","veg_status":"veg|non_veg|uncertain","confidence":0.0,'
            '"recommendation_type":"replacement|similar_veg","recommendations":[{"name":"string","why":"short explanation"},'
            '{"name":"string","why":"short explanation"},{"name":"string","why":"short explanation"}]}\n'
            f"{retry_instruction}\n"
            f"PASS 1 JSON:\n{json.dumps(pass1, ensure_ascii=False)}"
        )
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        return _extract_json(self._call_openrouter(messages, model))

    def _finalize(self, pass1: dict[str, Any], first_pass2: dict[str, Any], model: str) -> dict[str, Any]:
        first = _normalize_output(first_pass2, pass1)
        needs_retry = (not _is_valid_output(first)) or any(
            _has_nonveg_keywords(str(rec.get("name", ""))) for rec in first["recommendations"]
        )
        if needs_retry:
            second = _normalize_output(self._run_pass2(pass1, model, retry=True), pass1)
            if _is_valid_output(second) and not any(
                _has_nonveg_keywords(str(rec.get("name", ""))) for rec in second["recommendations"]
            ):
                return second

        cleaned = first
        cleaned["recommendations"] = [
            rec for rec in cleaned["recommendations"] if not _has_nonveg_keywords(str(rec.get("name", "")))
        ][:3]
        if len(cleaned["recommendations"]) < 3:
            for fallback in _fallback_recommendations(str(pass1.get("cuisine", ""))):
                if len(cleaned["recommendations"]) >= 3:
                    break
                if not _has_nonveg_keywords(fallback["name"]):
                    cleaned["recommendations"].append(fallback)
        cleaned["recommendations"] = cleaned["recommendations"][:3]

        if not _is_valid_output(cleaned):
            raise DishVisionError("Unable to produce a valid final JSON output")
        return cleaned

    def analyze(self, image_bytes: bytes, filename: str = "dish.jpg") -> Optional[DishVisionResult]:
        if not image_bytes:
            return None

        model = (get_model_name() or "").strip() or DEFAULT_MODEL
        pass1 = self._run_pass1(image_bytes, filename, model)
        final = self._finalize(pass1, self._run_pass2(pass1, model, retry=False), model)
        evidence = pass1.get("evidence") if isinstance(pass1.get("evidence"), list) else []
        cuisine = str(pass1.get("cuisine", "")).strip()

        return DishVisionResult(
            dish_name=str(final.get("dish_name", "")).strip(),
            veg_status=str(final.get("veg_status", "uncertain")).strip(),
            confidence=float(final.get("confidence", 0.0)),
            recommendation_type=str(final.get("recommendation_type", "similar_veg")).strip(),
            recommendations=[
                {"name": str(item.get("name", "")).strip(), "why": str(item.get("why", "")).strip()}
                for item in final.get("recommendations", [])
                if isinstance(item, dict)
            ],
            cuisine=cuisine,
            evidence=[str(item).strip() for item in evidence if str(item).strip()],
        )

    def analyze_hint(self, dish_name: str) -> Optional[DishVisionResult]:
        hint = (dish_name or "").strip()
        if not hint:
            return None

        model = (get_model_name() or "").strip() or DEFAULT_MODEL
        pass1 = {
            "dish_candidates": [hint],
            "cuisine": "",
            "key_ingredients_visible": [],
            "veg_status": "uncertain",
            "confidence": 0.5,
            "evidence": ["User-provided dish name, no image available."],
        }
        final = self._finalize(pass1, self._run_pass2(pass1, model, retry=False), model)

        return DishVisionResult(
            dish_name=str(final.get("dish_name", hint)).strip() or hint,
            veg_status=str(final.get("veg_status", "uncertain")).strip(),
            confidence=float(final.get("confidence", 0.0)),
            recommendation_type=str(final.get("recommendation_type", "similar_veg")).strip(),
            recommendations=[
                {"name": str(item.get("name", "")).strip(), "why": str(item.get("why", "")).strip()}
                for item in final.get("recommendations", [])
                if isinstance(item, dict)
            ],
            cuisine="",
            evidence=["User-provided dish name, no image available."],
        )
