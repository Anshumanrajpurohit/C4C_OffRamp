import os
from pathlib import Path
from functools import lru_cache
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent
SYSTEM_PROMPT_PATH = BASE_DIR / "system_role.md"

DEFAULT_MODEL = "openai/gpt-4o-mini"
DEFAULT_TEMPERATURE = 0.4
DEFAULT_META_API_VERSION = "v19.0"


def _read_system_prompt(file_path: Path) -> str:
    if not file_path.exists():
        raise FileNotFoundError(f"System prompt file not found at {file_path}")
    return file_path.read_text(encoding="utf-8").strip()


@lru_cache(maxsize=1)
def get_system_prompt() -> str:
    return _read_system_prompt(SYSTEM_PROMPT_PATH)


def get_openrouter_api_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set")
    return api_key


def get_model_name() -> str:
    return os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL)


def get_temperature() -> float:
    raw = os.getenv("OPENROUTER_TEMPERATURE")
    if raw is None:
        return DEFAULT_TEMPERATURE
    try:
        return float(raw)
    except ValueError as exc:
        raise ValueError("OPENROUTER_TEMPERATURE must be a float") from exc


def get_meta_access_token() -> str:
    token = os.getenv("META_WHATSAPP_TOKEN")
    if not token:
        raise RuntimeError("META_WHATSAPP_TOKEN is not set")
    return token


def get_meta_phone_number_id() -> str:
    phone_number_id = os.getenv("META_WHATSAPP_PHONE_NUMBER_ID")
    if not phone_number_id:
        raise RuntimeError("META_WHATSAPP_PHONE_NUMBER_ID is not set")
    return phone_number_id


def get_meta_api_version() -> str:
    return os.getenv("META_WHATSAPP_API_VERSION", DEFAULT_META_API_VERSION)


def get_meta_verify_token() -> Optional[str]:
    return os.getenv("META_WHATSAPP_VERIFY_TOKEN")
