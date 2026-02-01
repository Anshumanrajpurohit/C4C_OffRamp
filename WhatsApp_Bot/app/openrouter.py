from __future__ import annotations

import httpx
from typing import Iterable, Mapping

from .config import get_model_name, get_openrouter_api_key, get_system_prompt, get_temperature

Message = Mapping[str, str]


class OpenRouterError(RuntimeError):
    pass


class OpenRouterClient:
    def __init__(self, *, timeout: float = 30.0) -> None:
        self._timeout = timeout
        self._base_url = "https://openrouter.ai/api/v1/chat/completions"

    def build_messages(self, user_messages: Iterable[Message]) -> list[Message]:
        system_message = {"role": "system", "content": get_system_prompt()}
        return [system_message, *user_messages]

    def complete(self, user_messages: Iterable[Message]) -> str:
        payload = {
            "model": get_model_name(),
            "temperature": get_temperature(),
            "stream": False,
            "messages": self.build_messages(user_messages),
        }

        headers = {
            "Authorization": f"Bearer {get_openrouter_api_key()}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://offramp.chat",
            "X-Title": "OFFRAMP WhatsApp Assistant",
        }

        with httpx.Client(timeout=self._timeout) as client:
            response = client.post(self._base_url, json=payload, headers=headers)

        if response.status_code != 200:
            raise OpenRouterError(
                f"OpenRouter request failed with status {response.status_code}: {response.text}"
            )

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, TypeError) as exc:
            raise OpenRouterError("Unexpected OpenRouter response shape") from exc
