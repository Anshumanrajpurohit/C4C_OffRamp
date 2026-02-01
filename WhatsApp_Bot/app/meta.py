from __future__ import annotations

import httpx

from .config import (
    get_meta_access_token,
    get_meta_api_version,
    get_meta_phone_number_id,
)


class MetaWhatsAppError(RuntimeError):
    pass


class MetaWhatsAppClient:
    def __init__(self, *, timeout: float = 10.0) -> None:
        self._timeout = timeout
        self._access_token = get_meta_access_token()
        self._phone_number_id = get_meta_phone_number_id()
        self._api_version = get_meta_api_version()
        base = f"https://graph.facebook.com/{self._api_version}"
        self._messages_url = f"{base}/{self._phone_number_id}/messages"
        self._graph_base = base

    def send_text(self, to: str, body: str) -> None:
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": body},
        }

        headers = {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
        }

        with httpx.Client(timeout=self._timeout) as client:
            response = client.post(self._messages_url, json=payload, headers=headers)

        if response.status_code >= 300:
            raise MetaWhatsAppError(
                f"Failed to send message via WhatsApp Cloud API: {response.text}"
            )

    def send_interactive_buttons(self, to: str, body: str, buttons: list[dict[str, str]]) -> None:
        if not buttons:
            raise ValueError("buttons list cannot be empty")

        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": body},
                "action": {
                    "buttons": [
                        {
                            "type": "reply",
                            "reply": {"id": button["id"], "title": button["title"]},
                        }
                        for button in buttons
                    ]
                },
            },
        }

        headers = {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
        }

        with httpx.Client(timeout=self._timeout) as client:
            response = client.post(self._messages_url, json=payload, headers=headers)

        if response.status_code >= 300:
            raise MetaWhatsAppError(
                f"Failed to send interactive message via WhatsApp Cloud API: {response.text}"
            )

    def get_media_url(self, media_id: str) -> str:
        endpoint = f"{self._graph_base}/{media_id}"
        params = {"fields": "url"}
        headers = {"Authorization": f"Bearer {self._access_token}"}

        with httpx.Client(timeout=self._timeout) as client:
            response = client.get(endpoint, params=params, headers=headers)

        if response.status_code >= 300:
            raise MetaWhatsAppError(
                f"Failed to fetch media URL: {response.status_code} {response.text}"
            )

        try:
            return response.json()["url"]
        except (KeyError, ValueError, TypeError) as exc:
            raise MetaWhatsAppError("Malformed media URL response") from exc

    def download_media(self, media_id: str) -> bytes:
        media_url = self.get_media_url(media_id)
        headers = {"Authorization": f"Bearer {self._access_token}"}

        with httpx.Client(timeout=self._timeout) as client:
            response = client.get(media_url, headers=headers)

        if response.status_code >= 300:
            raise MetaWhatsAppError(
                f"Failed to download media: {response.status_code} {response.text}"
            )

        return response.content
