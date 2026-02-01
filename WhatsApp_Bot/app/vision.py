from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from typing import Optional

import httpx

from .config import get_model_name, get_openrouter_api_key, get_temperature


@dataclass
class DishVisionResult:
    name: str
    is_plant: bool
    confidence: float
    notes: str


class DishVisionError(RuntimeError):
    pass


class DishVision:
    def __init__(self, *, timeout: float = 40.0) -> None:
        self._timeout = timeout
        self._api_url = "https://openrouter.ai/api/v1/chat/completions"

    def analyze(self, image_bytes: bytes) -> Optional[DishVisionResult]:
        if not image_bytes:
            return None

        image_b64 = base64.b64encode(image_bytes).decode("ascii")
        image_data_uri = f"data:image/jpeg;base64,{image_b64}"

        prompt = (
            "You are OFFRAMP, an Indian food context assistant."
            " Look at the Dish Wizard and respond ONLY with a compact JSON object"
            " containing: name (string), plant_based (true/false), confidence (0-1),"
            " and notes (short string). Prioritise Indian dish recognition."
        )

        user_instructions = (
            "Return JSON only, no prose. If unsure, set name to empty string and confidence below 0.4."
        )

        messages = [
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": user_instructions},
                    {
                        "type": "input_image",
                        "image_url": {"url": image_data_uri},
                    },
                ],
            },
        ]

        payload = {
            "model": get_model_name(),
            "messages": messages,
            "temperature": 0.2,
            "stream": False,
        }

        headers = {
            "Authorization": f"Bearer {get_openrouter_api_key()}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://offramp.chat",
            "X-Title": "OFFRAMP Dish Wizard",
        }

        with httpx.Client(timeout=self._timeout) as client:
            response = client.post(self._api_url, json=payload, headers=headers)

        if response.status_code != 200:
            raise DishVisionError(
                f"OpenRouter vision request failed: {response.status_code} {response.text}"
            )

        data = response.json()
        try:
            content = data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, TypeError) as exc:
            raise DishVisionError("Unexpected response from vision model") from exc

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            return None

        name = str(parsed.get("name", "")).strip()
        is_plant = bool(parsed.get("plant_based", False))
        try:
            confidence = float(parsed.get("confidence", 0.0))
        except (TypeError, ValueError):
            confidence = 0.0
        notes = str(parsed.get("notes", "")).strip()

        return DishVisionResult(name=name, is_plant=is_plant, confidence=confidence, notes=notes)
