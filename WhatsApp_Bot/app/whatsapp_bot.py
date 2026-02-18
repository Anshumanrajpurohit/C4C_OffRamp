from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from urllib.parse import quote_plus
from typing import Any, Deque, Dict, Iterator, List, Optional, Tuple
from collections import defaultdict, deque

from flask import Flask, Response, jsonify, request

from .config import get_meta_verify_token
from .meta import MetaWhatsAppClient, MetaWhatsAppError
from .nearby import NearbySearchError, fetch_nearby_restaurants
from .openrouter import OpenRouterClient, OpenRouterError
from .vision import DishVision, DishVisionError, DishVisionResult

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ----- Constants ----------------------------------------------------------------

STATE_IDLE = "idle"
STATE_REPLACE_WAIT_DISH = "replace_wait_dish"
STATE_REPLACE_REFINING = "replace_refining"
STATE_FIND_WAIT_AREA = "find_wait_area"
STATE_FIND_WAIT_RULE = "find_wait_rule"
STATE_FIND_RESULTS = "find_results"
STATE_SET_RULES = "set_rules"
STATE_ALLERGY = "allergy"
STATE_ALLERGY_OTHER = "allergy_other"
STATE_DISH_WIZARD_WAIT_IMAGE = "dish_wizard_wait_image"
STATE_DISH_WIZARD_REVIEW = "dish_wizard_review"
STATE_DISH_WIZARD_TYPE_NAME = "dish_wizard_type_name"

BTN_FIND_NEARBY = "BTN_FIND_NEARBY"
BTN_REPLACE_DISH = "BTN_REPLACE_DISH"
BTN_SET_RULES = "BTN_SET_RULES"
BTN_HOW_WORKS = "BTN_HOW_WORKS"
BTN_DISH_WIZARD = "BTN_DISH_WIZARD"

BTN_REPLACE_JAIN = "BTN_REPLACE_JAIN"
BTN_REPLACE_TASTE = "BTN_REPLACE_TASTE"
BTN_REPLACE_BUDGET = "BTN_REPLACE_BUDGET"
BTN_REPLACE_NEARBY = "BTN_REPLACE_NEARBY"
BTN_REPLACE_THIS_WORKS = "BTN_REPLACE_THIS_WORKS"

BTN_TASTE_SPICY = "BTN_TASTE_SPICY"
BTN_TASTE_MILD = "BTN_TASTE_MILD"
BTN_TASTE_RICH = "BTN_TASTE_RICH"

BTN_BUDGET_LOW = "BTN_BUDGET_LOW"
BTN_BUDGET_MEDIUM = "BTN_BUDGET_MEDIUM"
BTN_BUDGET_PREMIUM = "BTN_BUDGET_PREMIUM"

BTN_RULE_VEGETARIAN = "BTN_RULE_VEGETARIAN"
BTN_RULE_VEGAN = "BTN_RULE_VEGAN"
BTN_RULE_JAIN = "BTN_RULE_JAIN"
BTN_RULE_ALLERGIES = "BTN_RULE_ALLERGIES"
BTN_RULE_NONE = "BTN_RULE_NONE"

BTN_CALL_RESTAURANT = "BTN_CALL_RESTAURANT"
BTN_OPEN_MAPS = "BTN_OPEN_MAPS"
BTN_MORE_FILTERS = "BTN_MORE_FILTERS"
BTN_NEW_SEARCH = "BTN_NEW_SEARCH"
BTN_FILTER_BUDGET = "BTN_FILTER_BUDGET"
BTN_FILTER_TASTE = "BTN_FILTER_TASTE"
BTN_MAIN_MENU = "BTN_MAIN_MENU"
BTN_TRY_AGAIN = "BTN_TRY_AGAIN"
BTN_STOP = "BTN_STOP"

BTN_DIET_VEGAN = "BTN_DIET_VEGAN"
BTN_DIET_VEGETARIAN = "BTN_DIET_VEGETARIAN"
BTN_DIET_FLEX = "BTN_DIET_FLEX"

BTN_RESTRICTION_JAIN = "BTN_RESTRICTION_JAIN"
BTN_RESTRICTION_ALLERGIES = "BTN_RESTRICTION_ALLERGIES"
BTN_RESTRICTION_RELIGIOUS = "BTN_RESTRICTION_RELIGIOUS"
BTN_RESTRICTION_NONE = "BTN_RESTRICTION_NONE"

BTN_ALLERGY_PEANUT = "BTN_ALLERGY_PEANUT"
BTN_ALLERGY_DAIRY = "BTN_ALLERGY_DAIRY"
BTN_ALLERGY_GLUTEN = "BTN_ALLERGY_GLUTEN"
BTN_ALLERGY_SHELLFISH = "BTN_ALLERGY_SHELLFISH"
BTN_ALLERGY_OTHER = "BTN_ALLERGY_OTHER"

BTN_SAFE_YES = "BTN_SAFE_YES"
BTN_SAFE_CHANGE = "BTN_SAFE_CHANGE"

BTN_TRY_ANOTHER = "BTN_TRY_ANOTHER"
BTN_FIND_RESTAURANTS = "BTN_FIND_RESTAURANTS"
BTN_CHANGE_PREFERENCES = "BTN_CHANGE_PREFERENCES"
BTN_DISH_SHOW_SWAPS = "BTN_DISH_SHOW_SWAPS"
BTN_DISH_COMPARE = "BTN_DISH_COMPARE"
BTN_DISH_ALLERGENS = "BTN_DISH_ALLERGENS"
BTN_DISH_CANCEL = "BTN_DISH_CANCEL"
BTN_DISH_FIND_NEARBY = "BTN_DISH_FIND_NEARBY"
BTN_DISH_TRY_PHOTO = "BTN_DISH_TRY_PHOTO"
BTN_DISH_UPLOAD_AGAIN = "BTN_DISH_UPLOAD_AGAIN"
BTN_DISH_TYPE_NAME = "BTN_DISH_TYPE_NAME"
BTN_DISH_NUTRIENTS = "BTN_DISH_NUTRIENTS"
BTN_DISH_SIMILAR = "BTN_DISH_SIMILAR"
BTN_DISH_UPLOAD_ANOTHER = "BTN_DISH_UPLOAD_ANOTHER"

FALLBACK_BUTTONS = [
    {"id": BTN_REPLACE_DISH, "title": "🔁 Swap a dish"},
    {"id": BTN_FIND_NEARBY, "title": "🍽️ Nearby food"},
    {"id": BTN_DISH_WIZARD, "title": "🧙 Dish Wizard"},
    {"id": BTN_SET_RULES, "title": "🥗 Food rules"},
]

GLOBAL_EXIT_BUTTONS = [
    {"id": BTN_MAIN_MENU, "title": "🏠 Main menu"},
    {"id": BTN_TRY_AGAIN, "title": "🔁 Retry"},
    {"id": BTN_STOP, "title": "❌ Stop"},
]


# ----- Data structures ----------------------------------------------------------


@dataclass
class Preferences:
    diet: Optional[str] = None
    taste: Optional[str] = None
    budget: Optional[str] = None
    area: Optional[str] = None
    restrictions: set[str] = field(default_factory=set)
    allergies: set[str] = field(default_factory=set)


@dataclass
class UserContext:
    flow: str = STATE_IDLE
    step: int = 0
    pending: Dict[str, Any] = field(default_factory=dict)
    preferences: Preferences = field(default_factory=Preferences)
    last_dish: Optional[str] = None
    last_swap_summary: Optional[str] = None
    llm_history: Deque[dict[str, str]] = field(default_factory=lambda: deque(maxlen=10))
    last_interaction: datetime = field(default_factory=datetime.utcnow)
    wizard_last_photo_id: Optional[str] = None
    wizard_last_dish: Optional[str] = None
    wizard_veg_status: Optional[str] = None
    wizard_confidence: float = 0.0
    wizard_recommendation_type: Optional[str] = None
    wizard_recommendations: List[Dict[str, str]] = field(default_factory=list)
    wizard_evidence: List[str] = field(default_factory=list)
    wizard_cuisine: str = ""


@dataclass
class OutgoingMessage:
    text: str
    buttons: List[Dict[str, str]] = field(default_factory=list)


@dataclass
class IncomingMessage:
    sender: str
    type: str
    text: str = ""
    message_id: Optional[str] = None
    button_id: Optional[str] = None
    button_title: Optional[str] = None
    media_id: Optional[str] = None
    media_type: Optional[str] = None


# ----- Application --------------------------------------------------------------


def create_app() -> Flask:
    app = Flask(__name__)
    client = OpenRouterClient()
    whatsapp = MetaWhatsAppClient()
    vision = DishVision()
    contexts: Dict[str, UserContext] = defaultdict(UserContext)
    processed_message_ids: Deque[str] = deque(maxlen=2000)
    processed_message_index: set[str] = set()

    def _mark_processed(message_id: str) -> None:
        if not message_id:
            return
        if message_id in processed_message_index:
            return
        if len(processed_message_ids) == processed_message_ids.maxlen:
            oldest = processed_message_ids[0]
            processed_message_index.discard(oldest)
        processed_message_ids.append(message_id)
        processed_message_index.add(message_id)

    stats = {
        "start_time": datetime.utcnow().isoformat() + "Z",
        "messages_processed": 0,
        "active_users": set(),
    }

    @app.get("/whatsapp")
    def verify_webhook() -> Response:
        mode = request.args.get("hub.mode")
        token = request.args.get("hub.verify_token")
        challenge = request.args.get("hub.challenge")

        if mode == "subscribe" and token and token == get_meta_verify_token():
            return Response(challenge or "", status=200, mimetype="text/plain")

        logger.warning("Webhook verification failed with mode=%s token=%s", mode, token)
        return Response("verification failed", status=403, mimetype="text/plain")

    @app.post("/whatsapp")
    def handle_message() -> Response:
        payload = request.get_json(silent=True) or {}

        for incoming in _iterate_incoming_messages(payload):
            if incoming.message_id and incoming.message_id in processed_message_index:
                logger.info("Skipping duplicate webhook message id=%s", incoming.message_id)
                continue
            if incoming.message_id:
                _mark_processed(incoming.message_id)

            stats["messages_processed"] += 1
            stats["active_users"].add(incoming.sender)
            context = contexts[incoming.sender]
            context.last_interaction = datetime.utcnow()

            if incoming.type == "button":
                responses = _handle_button_press(
                    incoming,
                    context,
                    client,
                )
            elif incoming.type == "image":
                responses = _handle_image_message(
                    incoming,
                    context,
                    client,
                    whatsapp,
                    vision,
                )
            else:
                responses = _handle_text_message(
                    incoming,
                    context,
                    client,
                )

            if not responses:
                responses = [_fallback_message(context)]

            if _should_ai_rewrite(context):
                rewritten: List[OutgoingMessage] = []
                for response in responses:
                    try:
                        rewritten.append(_ai_rewrite_response(client, context, response))
                    except Exception:  # fall back silently on rewrite failure
                        rewritten.append(response)

                responses = rewritten

            for response in responses:
                _deliver_response(whatsapp, incoming.sender, response)

        return jsonify({"status": "received"})

    @app.get("/")
    def show_stats() -> Response:
        return jsonify(
            {
                "status": "ok",
                "start_time": stats["start_time"],
                "messages_processed": stats["messages_processed"],
                "active_users": len(stats["active_users"]),
                "cached_contexts": len(contexts),
            }
        )

    @app.get("/health")
    def healthcheck() -> Response:
        return Response("ok", status=200, mimetype="text/plain")

    return app


# ----- Message processing -------------------------------------------------------


NEGATIVE_KEYWORDS = {
    "invest",
    "crypto",
    "bitcoin",
    "loan",
    "politics",
    "mods",
    "telegram",
    "share price",
    "stock",
    "earn money",
    "math homework",
    "code for",
    "hack",
    "exploit",
    "adult",
}


SWAP_ALLOWED_TARGETS = {"veg", "vegan", "jain"}
SWAP_ALLOWED_SOURCE_TYPES = {"non_veg", "veg", "vegan", "jain", "uncertain"}
SWAP_NON_VEG_TERMS = {
    "chicken",
    "mutton",
    "lamb",
    "beef",
    "pork",
    "fish",
    "seafood",
    "prawn",
    "shrimp",
    "crab",
    "egg",
    "eggs",
    "bacon",
    "ham",
    "turkey",
    "salami",
}
SWAP_DAIRY_HONEY_TERMS = {
    "milk",
    "cream",
    "butter",
    "ghee",
    "paneer",
    "cheese",
    "curd",
    "yogurt",
    "yoghurt",
    "honey",
    "lassi",
    "khoa",
    "khoya",
    "whey",
}
SWAP_JAIN_FORBIDDEN_TERMS = {
    "onion",
    "garlic",
    "potato",
    "potatoes",
    "carrot",
    "carrots",
    "beetroot",
    "beet",
    "radish",
    "sweet potato",
    "root vegetable",
    "roots",
    "yam",
    "turnip",
}


def _should_ai_rewrite(context: UserContext) -> bool:
    return context.flow not in {
        STATE_REPLACE_REFINING,
        STATE_FIND_WAIT_AREA,
        STATE_FIND_WAIT_RULE,
        STATE_FIND_RESULTS,
        STATE_DISH_WIZARD_WAIT_IMAGE,
        STATE_DISH_WIZARD_REVIEW,
        STATE_DISH_WIZARD_TYPE_NAME,
    }


def _requires_jain_rules(context: UserContext, extra_instruction: str | None) -> bool:
    instruction = (extra_instruction or "").strip().lower()
    return "jain" in instruction or "jain" in context.preferences.restrictions


def _resolve_swap_target(context: UserContext, extra_instruction: str | None) -> str:
    diet = (context.preferences.diet or "").strip().lower()
    target = "vegan" if diet == "vegan" else "veg"
    if _requires_jain_rules(context, extra_instruction) and target != "vegan":
        return "jain"
    return target


def _swap_build_messages(
    context: UserContext,
    dish_name: str,
    target: str,
    require_jain_rules: bool,
    extra_instruction: str | None = None,
    feedback: str = "",
) -> List[Dict[str, str]]:
    prefs = context.preferences
    preference_lines: List[str] = []
    if prefs.taste:
        preference_lines.append(f"Taste preference: {prefs.taste}")
    if prefs.budget:
        preference_lines.append(f"Budget preference: {prefs.budget}")
    if prefs.area:
        preference_lines.append(f"City/Area context: {prefs.area}")
    if prefs.allergies:
        preference_lines.append("Allergies to avoid where possible: " + ", ".join(sorted(prefs.allergies)))
    if prefs.restrictions:
        preference_lines.append("Restrictions: " + ", ".join(sorted(prefs.restrictions)))
    if extra_instruction:
        preference_lines.append(f"Special instruction: {extra_instruction.strip()}")

    hints = "\n".join(preference_lines) if preference_lines else "No extra preferences."

    prompt = (
        "You are OFFRAMP. Output STRICT JSON only.\n"
        "Task: Given an input dish and target diet, provide exactly 3 culturally similar swap dishes.\n"
        "Diet rules:\n"
        "- VEG: no meat/fish/seafood/egg. Dairy allowed.\n"
        "- VEGAN: no animal products (no meat/fish/seafood/egg/dairy/honey).\n"
        "- JAIN: vegetarian and no onion, garlic, potato, carrot, beetroot, radish, sweet potato, or root vegetables.\n"
        "Schema (exact keys only):\n"
        "{\n"
        '  "input_dish":"string",\n'
        '  "detected_source_type":"non_veg|veg|vegan|jain|uncertain",\n'
        '  "target":"veg|vegan|jain",\n'
        '  "swaps":[\n'
        '    {"name":"string","why":"short reason"},\n'
        '    {"name":"string","why":"short reason"},\n'
        '    {"name":"string","why":"short reason"}\n'
        "  ]\n"
        "}\n"
        "No markdown, no prose, no extra keys.\n\n"
        f"Input dish: {dish_name.strip()}\n"
        f"Target diet: {target}\n"
        f"Preferences:\n{hints}\n"
        f"Jain restrictions required: {'yes' if require_jain_rules else 'no'}\n"
        "Keep dish names natural for Indian users and avoid repeating the input dish name.\n"
    )

    if feedback:
        prompt += f"\nValidation feedback from previous attempt: {feedback}\nRegenerate corrected JSON."

    return [{"role": "user", "content": prompt}]


def _swap_extract_json_object(text: str) -> Dict[str, Any]:
    content = (text or "").strip()
    if not content:
        raise ValueError("Empty model response")

    try:
        loaded = json.loads(content)
        if isinstance(loaded, dict):
            return loaded
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", content, flags=re.DOTALL)
    if not match:
        raise ValueError("Could not locate JSON object in model response")

    parsed = json.loads(match.group(0))
    if not isinstance(parsed, dict):
        raise ValueError("Model response JSON was not an object")
    return parsed


def _swap_contains_any(text: str, terms: set[str]) -> bool:
    normalized = f" {text.lower()} "
    for term in terms:
        pattern = rf"(?<![a-z]){re.escape(term.lower())}(?![a-z])"
        if re.search(pattern, normalized):
            return True
    return False


def _swap_validate_result(
    result: Dict[str, Any],
    dish_name: str,
    target: str,
    require_jain_rules: bool,
) -> Tuple[bool, str]:
    if not isinstance(result, dict):
        return False, "Result is not a JSON object"

    required_top = {"input_dish", "detected_source_type", "target", "swaps"}
    if set(result.keys()) != required_top:
        return False, "Top-level keys must exactly match required schema"

    input_dish = str(result.get("input_dish", "")).strip()
    if not input_dish:
        return False, "input_dish must be a non-empty string"

    source_type = str(result.get("detected_source_type", "")).strip()
    if source_type not in SWAP_ALLOWED_SOURCE_TYPES:
        return False, "detected_source_type is invalid"

    if result.get("target") != target:
        return False, "target field must exactly match requested target"

    swaps = result.get("swaps")
    if not isinstance(swaps, list) or len(swaps) != 3:
        return False, "swaps must be a list with exactly 3 items"

    seen_names: set[str] = set()
    input_name = dish_name.strip().lower()
    for i, item in enumerate(swaps, start=1):
        if not isinstance(item, dict):
            return False, f"swap #{i} must be an object"
        if set(item.keys()) != {"name", "why"}:
            return False, f"swap #{i} must contain only name and why"

        name = str(item.get("name", "")).strip()
        why = str(item.get("why", "")).strip()
        if not name:
            return False, f"swap #{i} name must be non-empty string"
        if not why:
            return False, f"swap #{i} why must be non-empty string"

        lower_name = name.lower()
        if lower_name in seen_names:
            return False, "swap names must be unique"
        seen_names.add(lower_name)

        if lower_name == input_name:
            return False, f"swap #{i} must differ from input dish"

        if target == "veg":
            blocked_terms = SWAP_NON_VEG_TERMS
            if require_jain_rules:
                blocked_terms = blocked_terms | SWAP_JAIN_FORBIDDEN_TERMS
            if _swap_contains_any(name, blocked_terms):
                return False, f"swap #{i} violates veg rules"
        elif target == "vegan":
            blocked_terms = SWAP_NON_VEG_TERMS | SWAP_DAIRY_HONEY_TERMS
            if require_jain_rules:
                blocked_terms = blocked_terms | SWAP_JAIN_FORBIDDEN_TERMS
            if _swap_contains_any(name, blocked_terms):
                return False, f"swap #{i} violates vegan rules"
        elif target == "jain":
            if _swap_contains_any(name, SWAP_NON_VEG_TERMS | SWAP_JAIN_FORBIDDEN_TERMS):
                return False, f"swap #{i} violates jain rules"
        else:
            return False, "Invalid target"

    return True, "ok"


def _swap_fallback_result(dish_name: str, target: str, require_jain_rules: bool) -> Dict[str, Any]:
    if target == "jain" or (target == "veg" and require_jain_rules):
        swaps = [
            {"name": "Jain Vegetable Pulao", "why": "Keeps familiar masala aroma while staying Jain-safe."},
            {"name": "Jain Moong Dal Khichdi", "why": "Comforting texture and gentle spice profile."},
            {"name": "Jain Paneer Tikka", "why": "Protein-rich and smoky, with no onion or garlic."},
        ]
    elif target == "vegan" and require_jain_rules:
        swaps = [
            {"name": "Jain Tofu Tikka", "why": "Smoky protein-rich bites without dairy, onion, or garlic."},
            {"name": "Jain Vegetable Pulao", "why": "Familiar rice masala profile while staying vegan and Jain-safe."},
            {"name": "Coconut Moong Dal Khichdi", "why": "Comforting texture with mild spices and no root vegetables."},
        ]
    elif target == "vegan":
        swaps = [
            {"name": "Soya Chunk Masala", "why": "High-protein bite and strong masala absorption."},
            {"name": "Jackfruit Pepper Fry", "why": "Fibrous texture with familiar Indian spice depth."},
            {"name": "Tofu Curry", "why": "Carries gravy well and stays fully plant-based."},
        ]
    else:
        swaps = [
            {"name": "Paneer Bhurji", "why": "Familiar masala style and satisfying texture."},
            {"name": "Mushroom Pepper Fry", "why": "Savory bite with strong spice compatibility."},
            {"name": "Soya Keema", "why": "Protein-dense and close to keema-style mouthfeel."},
        ]

    return {
        "input_dish": dish_name.strip(),
        "detected_source_type": "uncertain",
        "target": target,
        "swaps": swaps,
    }


def _swap_generate_result(
    context: UserContext,
    client: OpenRouterClient,
    dish_name: str,
    extra_instruction: str | None = None,
) -> Dict[str, Any]:
    target = _resolve_swap_target(context, extra_instruction)
    require_jain_rules = _requires_jain_rules(context, extra_instruction)
    if target not in SWAP_ALLOWED_TARGETS:
        target = "veg"

    feedback = ""
    last_error = "unknown validation failure"
    for attempt in range(2):
        messages = _swap_build_messages(
            context=context,
            dish_name=dish_name,
            target=target,
            require_jain_rules=require_jain_rules,
            extra_instruction=extra_instruction,
            feedback=feedback,
        )

        try:
            raw = client.complete(messages)
            parsed = _swap_extract_json_object(raw)
        except (OpenRouterError, RuntimeError, ValueError, json.JSONDecodeError) as error:
            last_error = str(error)
            feedback = f"Could not parse JSON: {last_error}"
            logger.warning("Swap generation parsing failed for %s (attempt %s): %s", dish_name, attempt + 1, error)
            continue

        valid, reason = _swap_validate_result(parsed, dish_name, target, require_jain_rules)
        if valid:
            return parsed

        last_error = reason
        feedback = reason
        logger.info("Swap validation failed for %s (attempt %s): %s", dish_name, attempt + 1, reason)

    logger.warning("Using fallback swaps for %s after retry: %s", dish_name, last_error)
    return _swap_fallback_result(dish_name, target, require_jain_rules)


def _swap_format_text(swaps: List[Dict[str, str]]) -> str:
    lines: List[str] = []
    for index, item in enumerate(swaps[:3], start=1):
        name = str(item.get("name", "")).strip() or "Plant-based option"
        why = str(item.get("why", "")).strip() or "Close match for this cuisine."
        lines.append(f"{index}. {name}\n- {why}")
    return "\n\n".join(lines)


def _handle_text_message(
    incoming: IncomingMessage,
    context: UserContext,
    client: OpenRouterClient,
) -> List[OutgoingMessage]:
    raw_text = incoming.text.strip()
    text = raw_text.lower()

    if _is_negative_prompt(text):
        return _off_mission_response(context)

    if _is_greeting(text):
        return _send_welcome(context)

    if context.flow == STATE_DISH_WIZARD_WAIT_IMAGE:
        return [
            OutgoingMessage(
                text=(
                    "I’m waiting for the photo 🙂\n"
                    "Snap the dish and send it here, or tap ✍️ Type dish name."
                ),
                buttons=[
                    {"id": BTN_DISH_UPLOAD_AGAIN, "title": "📸 Upload again"},
                    {"id": BTN_DISH_TYPE_NAME, "title": "✍️ Type dish name"},
                ]
                + GLOBAL_EXIT_BUTTONS,
            )
        ]

    if context.flow == STATE_DISH_WIZARD_TYPE_NAME:
        return _process_manual_dish_input(context, client, incoming.text)

    if context.flow == STATE_REPLACE_WAIT_DISH:
        return _process_dish_submission(context, client, incoming.text)

    if context.flow == STATE_FIND_WAIT_AREA:
        return _process_area_submission(context, incoming.text)

    if context.flow == STATE_ALLERGY_OTHER:
        return _process_custom_allergy(context, incoming.text)

    # Allow typed commands to trigger flows directly
    if "replace" in text and "dish" in text:
        return _start_replace_flow(context)
    if "find" in text and "food" in text:
        return _start_find_food_flow(context)
    if "set" in text and "rule" in text:
        return _start_set_rules_flow(context)
    if "how" in text and "work" in text:
        return _explain_how_it_works(context)

    return []


def _handle_button_press(
    incoming: IncomingMessage,
    context: UserContext,
    client: OpenRouterClient,
) -> List[OutgoingMessage]:
    button_id = incoming.button_id or ""

    if button_id == BTN_FIND_NEARBY:
        return _start_find_food_flow(context)
    if button_id == BTN_REPLACE_DISH:
        return _start_replace_flow(context)
    if button_id == BTN_SET_RULES:
        return _start_set_rules_flow(context)
    if button_id == BTN_HOW_WORKS:
        return _explain_how_it_works(context)
    if button_id == BTN_DISH_WIZARD:
        return _start_dish_wizard(context)

    if button_id == BTN_MAIN_MENU:
        return _send_welcome(context)
    if button_id == BTN_TRY_AGAIN:
        if context.flow in {STATE_DISH_WIZARD_REVIEW, STATE_DISH_WIZARD_WAIT_IMAGE, STATE_DISH_WIZARD_TYPE_NAME}:
            return _start_dish_wizard(context)
        return [_fallback_message(context)]
    if button_id == BTN_STOP:
        context.flow = STATE_IDLE
        context.step = 0
        return [OutgoingMessage(text="No worries. Ping me anytime when you want food help 🌱.")]

    if button_id == BTN_REPLACE_JAIN:
        context.preferences.restrictions.add("jain")
        return _regenerate_swap(context, client, extra_instruction="Make it Jain-safe (no onion or garlic).")
    if button_id == BTN_REPLACE_TASTE:
        context.flow = STATE_REPLACE_REFINING
        context.step = 3
        return [
            OutgoingMessage(
                text="Got it! Pick the flavour vibe you want 👇",
                buttons=[
                    {"id": BTN_TASTE_SPICY, "title": "🌶️ Spicy"},
                    {"id": BTN_TASTE_MILD, "title": "😌 Mild"},
                    {"id": BTN_TASTE_RICH, "title": "🧈 Rich & creamy"},
                ],
            )
        ]
    if button_id == BTN_TASTE_SPICY and context.flow != STATE_SET_RULES:
        context.preferences.taste = "spicy"
        if context.flow == STATE_FIND_RESULTS:
            return _show_restaurant_results(context)
        return _regenerate_swap(context, client, extra_instruction="Dial up the spice level.")
    if button_id == BTN_TASTE_MILD and context.flow != STATE_SET_RULES:
        context.preferences.taste = "mild"
        if context.flow == STATE_FIND_RESULTS:
            return _show_restaurant_results(context)
        return _regenerate_swap(context, client, extra_instruction="Keep flavours mild and soothing.")
    if button_id == BTN_TASTE_RICH and context.flow != STATE_SET_RULES:
        context.preferences.taste = "rich"
        if context.flow == STATE_FIND_RESULTS:
            return _show_restaurant_results(context)
        return _regenerate_swap(context, client, extra_instruction="Highlight rich, creamy mouthfeel.")

    if button_id == BTN_REPLACE_BUDGET:
        context.flow = STATE_REPLACE_REFINING
        context.step = 4
        return [
            OutgoingMessage(
                text="Sure, what budget should I aim for?",
                buttons=[
                    {"id": BTN_BUDGET_LOW, "title": "💸 Low"},
                    {"id": BTN_BUDGET_MEDIUM, "title": "💰 Medium"},
                    {"id": BTN_BUDGET_PREMIUM, "title": "💎 Premium"},
                ],
            )
        ]
    if button_id == BTN_BUDGET_LOW and context.flow != STATE_SET_RULES:
        context.preferences.budget = "low"
        if context.flow == STATE_FIND_RESULTS:
            return _show_restaurant_results(context)
        return _regenerate_swap(context, client, extra_instruction="Keep it super budget-friendly.")
    if button_id == BTN_BUDGET_MEDIUM and context.flow != STATE_SET_RULES:
        context.preferences.budget = "medium"
        if context.flow == STATE_FIND_RESULTS:
            return _show_restaurant_results(context)
        return _regenerate_swap(context, client, extra_instruction="Aim for mid-range pricing.")
    if button_id == BTN_BUDGET_PREMIUM and context.flow != STATE_SET_RULES:
        context.preferences.budget = "premium"
        if context.flow == STATE_FIND_RESULTS:
            return _show_restaurant_results(context)
        return _regenerate_swap(context, client, extra_instruction="Pick premium, restaurant-ready dishes.")

    if button_id == BTN_REPLACE_NEARBY:
        return _start_find_food_flow(context, carry_dish=context.last_dish)
    if button_id == BTN_REPLACE_THIS_WORKS:
        return _celebrate_swap_success(context)
    if button_id == BTN_TRY_ANOTHER:
        return _start_replace_flow(context)
    if button_id == BTN_FIND_RESTAURANTS:
        return _start_find_food_flow(context)

    if button_id == BTN_DISH_SHOW_SWAPS:
        return _dish_wizard_show_swaps(context)
    if button_id == BTN_DISH_COMPARE:
        return _dish_wizard_compare(context)
    if button_id == BTN_DISH_ALLERGENS:
        return _dish_wizard_allergens(context)
    if button_id == BTN_DISH_CANCEL:
        context.flow = STATE_IDLE
        context.step = 0
        context.wizard_last_dish = None
        context.wizard_veg_status = None
        context.wizard_confidence = 0.0
        context.wizard_recommendation_type = None
        context.wizard_recommendations = []
        context.wizard_evidence = []
        context.wizard_cuisine = ""
        return [OutgoingMessage(text="Dish wizard closed. Want anything else?", buttons=FALLBACK_BUTTONS)]
    if button_id == BTN_DISH_FIND_NEARBY:
        dish = context.wizard_last_dish or context.pending.get("focus_dish")
        return _start_find_food_flow(context, carry_dish=dish)
    if button_id == BTN_DISH_TRY_PHOTO:
        return _start_dish_wizard(context)
    if button_id == BTN_DISH_UPLOAD_AGAIN:
        return _start_dish_wizard(context)
    if button_id == BTN_DISH_TYPE_NAME:
        context.flow = STATE_DISH_WIZARD_TYPE_NAME
        context.step = 1
        return [
            OutgoingMessage(
                text="Okay, type the dish name and I’ll guide you 🌱",
                buttons=GLOBAL_EXIT_BUTTONS,
            )
        ]
    if button_id == BTN_DISH_NUTRIENTS:
        return _dish_wizard_nutrients(context)
    if button_id == BTN_DISH_SIMILAR:
        return _dish_wizard_similar(context)
    if button_id == BTN_DISH_UPLOAD_ANOTHER:
        return _start_dish_wizard(context)

    if button_id == BTN_RULE_VEGETARIAN:
        context.preferences.diet = "vegetarian"
        return _show_restaurant_results(context)
    if button_id == BTN_RULE_VEGAN:
        context.preferences.diet = "vegan"
        return _show_restaurant_results(context)
    if button_id == BTN_RULE_JAIN:
        context.preferences.restrictions.add("jain")
        return _show_restaurant_results(context)
    if button_id == BTN_RULE_ALLERGIES:
        return _start_allergy_flow(context, return_flow=STATE_FIND_WAIT_RULE)
    if button_id == BTN_RULE_NONE:
        return _show_restaurant_results(context)

    if button_id == BTN_CALL_RESTAURANT:
        results = context.pending.get("restaurant_results")
        options = results if isinstance(results, list) else []
        call_lines: List[str] = []
        for idx, item in enumerate(options[:5], start=1):
            if not isinstance(item, dict):
                continue
            phone = str(item.get("phone") or "").strip()
            name = str(item.get("name") or f"Option {idx}").strip()
            if phone:
                call_lines.append(f"{idx}. {name}: {phone}")

        if call_lines:
            return [
                OutgoingMessage(
                    text=(
                        "Call these first and confirm vegan/Jain prep plus cross-contamination:\n\n"
                        + "\n".join(call_lines)
                    ),
                    buttons=[
                        {"id": BTN_OPEN_MAPS, "title": "Open Maps"},
                        {"id": BTN_NEW_SEARCH, "title": "New search"},
                    ],
                )
            ]

        return [
            OutgoingMessage(
                text=(
                    "I do not have direct phone numbers for these listings yet.\n"
                    "Tap Open Maps and call from listing details."
                ),
                buttons=[
                    {"id": BTN_OPEN_MAPS, "title": "Open Maps"},
                    {"id": BTN_NEW_SEARCH, "title": "New search"},
                ],
            )
        ]
    if button_id == BTN_OPEN_MAPS:
        maps_url = ""
        results = context.pending.get("restaurant_results")
        if isinstance(results, list):
            for item in results:
                if not isinstance(item, dict):
                    continue
                candidate = str(item.get("maps_url") or "").strip()
                if candidate:
                    maps_url = candidate
                    break
        if not maps_url:
            area = (context.preferences.area or "").strip() or "your area"
            maps_url = _build_default_maps_url(area, context.preferences.diet, context.preferences.restrictions)
        return [
            OutgoingMessage(
                text=f"Open this in Maps:\n{maps_url}\n\nPing me after you check and I can refine options.",
                buttons=[
                    {"id": BTN_MORE_FILTERS, "title": "More filters"},
                    {"id": BTN_NEW_SEARCH, "title": "New search"},
                ],
            )
        ]
    if button_id == BTN_MORE_FILTERS:
        return [
            OutgoingMessage(
                text="Filters coming right up 👇 Pick what matters most.",
                buttons=[
                    {"id": BTN_FILTER_BUDGET, "title": "💸 Budget"},
                    {"id": BTN_FILTER_TASTE, "title": "🌶️ Flavour"},
                    {"id": BTN_NEW_SEARCH, "title": "New search"},
                ],
            )
        ]
    if button_id == BTN_NEW_SEARCH:
        return _start_find_food_flow(context)

    if button_id == BTN_FILTER_BUDGET:
        return [
            OutgoingMessage(
                text="For budget tweaks, tell me low / medium / premium and I’ll remember it. Want me to update your saved rules?",
                buttons=[
                    {"id": BTN_BUDGET_LOW, "title": "💸 Low"},
                    {"id": BTN_BUDGET_MEDIUM, "title": "💰 Medium"},
                    {"id": BTN_BUDGET_PREMIUM, "title": "💎 Premium"},
                ],
            )
        ]
    if button_id == BTN_FILTER_TASTE:
        return [
            OutgoingMessage(
                text="Noted! What flavour are you craving?",
                buttons=[
                    {"id": BTN_TASTE_SPICY, "title": "🌶️ Spicy"},
                    {"id": BTN_TASTE_MILD, "title": "😌 Mild"},
                    {"id": BTN_TASTE_RICH, "title": "🧈 Rich"},
                ],
            )
        ]

    if context.flow == STATE_SET_RULES:
        return _handle_set_rules_buttons(context, button_id)

    if button_id == BTN_CHANGE_PREFERENCES:
        return _start_set_rules_flow(context)

    if button_id in {BTN_ALLERGY_PEANUT, BTN_ALLERGY_DAIRY, BTN_ALLERGY_GLUTEN, BTN_ALLERGY_SHELLFISH}:
        allergy_lookup = {
            BTN_ALLERGY_PEANUT: "peanuts",
            BTN_ALLERGY_DAIRY: "dairy",
            BTN_ALLERGY_GLUTEN: "gluten",
            BTN_ALLERGY_SHELLFISH: "shellfish",
        }
        context.preferences.allergies.add(allergy_lookup[button_id])
        return _allergy_caution_message(context)

    if button_id == BTN_ALLERGY_OTHER:
        context.flow = STATE_ALLERGY_OTHER
        context.step = 2
        return [OutgoingMessage(text="Thanks! Type the allergen I should watch for.")]

    if button_id == BTN_SAFE_YES:
        return _resume_post_allergy(context)

    if button_id == BTN_SAFE_CHANGE:
        return _start_allergy_flow(context)

    return []


def _handle_image_message(
    incoming: IncomingMessage,
    context: UserContext,
    client: OpenRouterClient,
    whatsapp: MetaWhatsAppClient,
    vision: DishVision,
) -> List[OutgoingMessage]:
    if context.flow == STATE_DISH_WIZARD_WAIT_IMAGE and incoming.media_type == "image":
        return _process_wizard_image(context, client, whatsapp, vision, incoming)

    return [
        OutgoingMessage(
            text=(
                "Love the photo! To help, tell me the dish name or tap 🏠 Main menu."
            ),
            buttons=[
                {"id": BTN_DISH_TYPE_NAME, "title": "✍️ Type dish name"},
            ]
            + GLOBAL_EXIT_BUTTONS,
        )
    ]


def _is_negative_prompt(text: str) -> bool:
    normalized = text.lower()
    return any(keyword in normalized for keyword in NEGATIVE_KEYWORDS)


def _is_greeting(text: str) -> bool:
    stripped = text.strip().lower()
    exact_matches = {
        "hi",
        "hello",
        "hey",
        "hii",
        "start",
        "menu",
        "help",
        "hola",
    }
    if stripped in exact_matches:
        return True

    tokens = stripped.split()
    if tokens and tokens[0] in exact_matches:
        return True

    for keyword in ("hi", "hello", "hey"):
        if keyword in stripped:
            return True

    return False


def _off_mission_response(context: UserContext) -> List[OutgoingMessage]:
    context.flow = STATE_IDLE
    context.step = 0
    return [
        OutgoingMessage(
            text=(
                "I might skip that 🙏\n"
                "I’m here for food swaps, Jain/vegan-safe finds, and easing dietary stress."
            ),
            buttons=[
                {"id": BTN_REPLACE_DISH, "title": "🔁 Replace a dish"},
                {"id": BTN_FIND_NEARBY, "title": "🍽️ Find food"},
                {"id": BTN_SET_RULES, "title": "🥗 Set rules"},
            ],
        )
    ]


# ----- Flow helpers -------------------------------------------------------------


def _send_welcome(context: UserContext) -> List[OutgoingMessage]:
    context.flow = STATE_IDLE
    context.step = 0
    context.pending.clear()
    text = (
        "Hey 👋 I’m OffRamp 🌱\n\n"
        "I help you:\n"
        "• Find dietary-safe food\n"
        "• Discover plant-based alternatives\n"
        "• Reduce food stress (Jain, vegan, allergies)\n\n"
        "What do you want to do today?"
    )

    primary = [
        {"id": BTN_FIND_NEARBY, "title": "🍽️ Nearby food"},
        {"id": BTN_REPLACE_DISH, "title": "🔁 Swap a dish"},
        {"id": BTN_DISH_WIZARD, "title": "🧙 Dish Wizard"},
        {"id": BTN_SET_RULES, "title": "🥗 Food rules"},
        {"id": BTN_HOW_WORKS, "title": "❓ How it works"},
    ]

    return [OutgoingMessage(text=text, buttons=primary)]


def _start_replace_flow(context: UserContext) -> List[OutgoingMessage]:
    context.flow = STATE_REPLACE_WAIT_DISH
    context.step = 1
    context.pending.clear()
    return [
        OutgoingMessage(
            text=(
                "Cool 👍\nTell me a dish you usually eat.\n\nExamples:\n"
                "• Chicken Biryani\n• Paneer Butter Masala\n• Fish Curry"
            )
        )
    ]


def _process_dish_submission(
    context: UserContext,
    client: OpenRouterClient,
    dish_name: str,
) -> List[OutgoingMessage]:
    context.last_dish = dish_name.strip()
    context.flow = STATE_REPLACE_REFINING
    context.step = 2
    context.llm_history.clear()
    return _regenerate_swap(context, client)


def _regenerate_swap(
    context: UserContext,
    client: OpenRouterClient,
    extra_instruction: str | None = None,
) -> List[OutgoingMessage]:
    if not context.last_dish:
        return _start_replace_flow(context)

    swap_result = _swap_generate_result(
        context=context,
        client=client,
        dish_name=context.last_dish,
        extra_instruction=extra_instruction,
    )
    target = str(swap_result.get("target", "veg")).strip().lower() or "veg"
    swaps = swap_result.get("swaps")
    if not isinstance(swaps, list):
        swaps = []
    swap_text = _swap_format_text([item for item in swaps if isinstance(item, dict)])

    context.last_swap_summary = swap_text
    buttons = [
        {"id": BTN_REPLACE_JAIN, "title": "🧄 Jain version"},
        {"id": BTN_REPLACE_TASTE, "title": "🌶️ Spicy / Mild"},
        {"id": BTN_REPLACE_BUDGET, "title": "💸 Budget friendly"},
        {"id": BTN_REPLACE_NEARBY, "title": "📍 Find nearby"},
        {"id": BTN_REPLACE_THIS_WORKS, "title": "👍 This works"},
    ]

    target_label = {"veg": "vegetarian", "vegan": "vegan", "jain": "jain-safe"}.get(target, "plant-based")
    text = (
        f"Here are close {target_label} swaps:\n\n"
        f"{swap_text.strip()}\n\n"
        "Want to refine this?"
    )
    return [OutgoingMessage(text=text, buttons=buttons)]


def _start_dish_wizard(context: UserContext) -> List[OutgoingMessage]:
    context.flow = STATE_DISH_WIZARD_WAIT_IMAGE
    context.step = 1
    context.pending.clear()
    context.wizard_last_photo_id = None
    context.wizard_last_dish = None
    context.wizard_veg_status = None
    context.wizard_confidence = 0.0
    context.wizard_recommendation_type = None
    context.wizard_recommendations = []
    context.wizard_evidence = []
    context.wizard_cuisine = ""
    return [
        OutgoingMessage(
            text=(
                "Nice 📸\nUpload a photo of your dish.\n\nI’ll:\n"
                "• Identify the dish\n• Check if it’s vegan or non-vegan\n"
                "• Suggest swaps or insights\n\nReal food photos work best."
            ),
            buttons=[
                {"id": BTN_DISH_TYPE_NAME, "title": "✍️ Type dish name"},
            ]
            + GLOBAL_EXIT_BUTTONS,
        )
    ]


def _process_wizard_image(
    context: UserContext,
    client: OpenRouterClient,
    whatsapp: MetaWhatsAppClient,
    vision: DishVision,
    incoming: IncomingMessage,
) -> List[OutgoingMessage]:
    _ = client  # unused in this flow
    context.wizard_last_photo_id = incoming.media_id
    hint = incoming.text.strip() if incoming.text else ""

    image_bytes = b""
    if incoming.media_id:
        try:
            image_bytes = whatsapp.download_media(incoming.media_id)
        except MetaWhatsAppError as error:
            logger.exception("Failed to download image %s: %s", incoming.media_id, error)

    vision_result: Optional[DishVisionResult] = None
    if image_bytes:
        try:
            filename = f"{incoming.media_id or 'dish'}.jpg"
            vision_result = vision.analyze(image_bytes, filename=filename)
        except DishVisionError as error:
            logger.exception("Vision analysis error for %s: %s", incoming.media_id, error)

    if vision_result is None and hint:
        try:
            vision_result = vision.analyze_hint(hint)
        except DishVisionError as error:
            logger.exception("Hint analysis error: %s", error)

    if vision_result is None:
        return _dish_wizard_low_confidence(context)

    if vision_result.confidence < 0.3 and vision_result.veg_status == "uncertain":
        context.wizard_last_dish = vision_result.dish_name or hint or "this dish"
        return _dish_wizard_low_confidence(context)

    _apply_wizard_result(context, vision_result, fallback_name=hint or "this dish")

    if context.wizard_veg_status == "non_veg":
        return _dish_wizard_non_veg_response(context)

    return _dish_wizard_plant_response(context)


def _process_manual_dish_input(
    context: UserContext,
    client: OpenRouterClient,
    dish_text: str,
) -> List[OutgoingMessage]:
    _ = client  # unused in this flow
    hint = dish_text.strip()
    if not hint:
        return _dish_wizard_low_confidence(context)

    try:
        vision_result = DishVision().analyze_hint(hint)
    except DishVisionError as error:
        logger.exception("Manual dish analysis failed for %s: %s", hint, error)
        vision_result = None

    if vision_result is None:
        context.wizard_last_dish = hint
        return _dish_wizard_low_confidence(context)

    if vision_result.confidence < 0.3 and vision_result.veg_status == "uncertain":
        context.wizard_last_dish = vision_result.dish_name or hint
        return _dish_wizard_low_confidence(context)

    _apply_wizard_result(context, vision_result, fallback_name=hint)

    if context.wizard_veg_status == "non_veg":
        return _dish_wizard_non_veg_response(context)

    return _dish_wizard_plant_response(context)


def _apply_wizard_result(
    context: UserContext,
    result: DishVisionResult,
    fallback_name: str,
) -> None:
    dish_name = (result.dish_name or fallback_name or "this dish").strip()
    context.wizard_last_dish = dish_name
    context.wizard_veg_status = (result.veg_status or "uncertain").strip().lower()
    context.wizard_confidence = float(result.confidence or 0.0)
    context.wizard_recommendation_type = (result.recommendation_type or "similar_veg").strip().lower()
    context.wizard_recommendations = list(result.recommendations or [])
    context.wizard_evidence = list(result.evidence or [])
    context.wizard_cuisine = (result.cuisine or "").strip()
    context.flow = STATE_DISH_WIZARD_REVIEW
    context.step = 2
    context.pending["focus_dish"] = dish_name


def _format_wizard_recommendations(recommendations: List[Dict[str, str]]) -> str:
    options = recommendations[:3]
    if not options:
        return (
            "1. Paneer Tikka\n- Similar spice profile and texture.\n\n"
            "2. Chana Masala\n- Familiar masala depth with plant protein."
        )

    lines: List[str] = []
    for index, item in enumerate(options, start=1):
        name = str(item.get("name", "")).strip() or "Plant-based option"
        why = str(item.get("why", "")).strip() or "Close match."
        lines.append(f"{index}. {name}\n- {why}")
    return "\n\n".join(lines)


def _dish_wizard_non_veg_response(context: UserContext) -> List[OutgoingMessage]:
    dish = context.wizard_last_dish or "that dish"
    confidence = int(round(context.wizard_confidence * 100))
    preview = _format_wizard_recommendations(context.wizard_recommendations[:2])
    text = (
        f"I detected *{dish.title()}* as likely non-veg ({confidence}% confidence).\n\n"
        "Top plant-based replacements:\n"
        f"{preview}\n\n"
        "Want full swaps, compare view, or allergen checks?"
    )
    buttons = [
        {"id": BTN_DISH_SHOW_SWAPS, "title": "🌱 Vegan swaps"},
        {"id": BTN_DISH_COMPARE, "title": "📊 Compare"},
        {"id": BTN_DISH_ALLERGENS, "title": "⚠️ Allergens"},
        {"id": BTN_DISH_CANCEL, "title": "❌ Cancel"},
    ] + GLOBAL_EXIT_BUTTONS
    context.flow = STATE_DISH_WIZARD_REVIEW
    return [OutgoingMessage(text=text, buttons=buttons)]


def _dish_wizard_show_swaps(context: UserContext) -> List[OutgoingMessage]:
    dish = context.wizard_last_dish or "that dish"
    heading = "replacement" if context.wizard_recommendation_type == "replacement" else "similar veg"
    text = (
        f"Best {heading} options for {dish.title()}:\n\n"
        f"{_format_wizard_recommendations(context.wizard_recommendations)}"
    )
    buttons = [
        {"id": BTN_DISH_FIND_NEARBY, "title": "📍 Nearby"},
        {"id": BTN_REPLACE_THIS_WORKS, "title": "👍 This works"},
        {"id": BTN_DISH_TRY_PHOTO, "title": "🔁 Another photo"},
    ] + GLOBAL_EXIT_BUTTONS
    context.flow = STATE_DISH_WIZARD_REVIEW
    context.pending["focus_dish"] = dish
    return [OutgoingMessage(text=text, buttons=buttons)]


def _dish_wizard_compare(context: UserContext) -> List[OutgoingMessage]:
    dish = context.wizard_last_dish or "the original"
    if context.wizard_veg_status == "non_veg":
        text = (
            f"Quick compare for {dish.title()}:\n\n"
            "Plant-based swaps usually have:\n"
            "- Lower saturated fat\n"
            "- No meat or seafood ingredients\n"
            "- Lower environmental impact\n\n"
            "Nutrition varies by recipe and cooking method."
        )
    else:
        text = (
            f"{dish.title()} already appears plant-forward.\n\n"
            "You can still use similar dishes to vary protein, fiber, and flavor in the same cuisine style."
        )
    buttons = [
        {"id": BTN_DISH_SHOW_SWAPS, "title": "🌱 Show swaps"},
        {"id": BTN_DISH_TRY_PHOTO, "title": "🔁 Another photo"},
    ] + GLOBAL_EXIT_BUTTONS
    context.flow = STATE_DISH_WIZARD_REVIEW
    return [OutgoingMessage(text=text, buttons=buttons)]


def _dish_wizard_allergens(context: UserContext) -> List[OutgoingMessage]:
    allergens: List[str] = []
    names = " ".join(str(item.get("name", "")).lower() for item in context.wizard_recommendations)
    if any(token in names for token in {"tofu", "soy", "soya", "tempeh"}):
        allergens.append("- Soy")
    if any(token in names for token in {"paneer", "cheese", "curd"}):
        allergens.append("- Dairy")
    if any(token in names for token in {"seitan", "wheat", "noodle", "bread"}):
        allergens.append("- Gluten")
    if not allergens:
        allergens = ["- Spices", "- Nuts (restaurant dependent)", "- Ingredient substitutions"]

    text = (
        "Possible allergens to verify:\n"
        f"{chr(10).join(allergens)}\n\n"
        "Always confirm ingredient handling and cross-contamination with the kitchen."
    )
    buttons = [
        {"id": BTN_DISH_SHOW_SWAPS, "title": "🌱 Show swaps"},
        {"id": BTN_DISH_TRY_PHOTO, "title": "🔁 Another photo"},
    ] + GLOBAL_EXIT_BUTTONS
    context.flow = STATE_DISH_WIZARD_REVIEW
    return [OutgoingMessage(text=text, buttons=buttons)]


def _dish_wizard_plant_response(context: UserContext) -> List[OutgoingMessage]:
    dish = context.wizard_last_dish or "this dish"
    status = context.wizard_veg_status or "uncertain"
    confidence = int(round(context.wizard_confidence * 100))
    lead = "looks plant-based" if status == "veg" else "is possibly plant-based"
    evidence = context.wizard_evidence[0] if context.wizard_evidence else ""
    evidence_line = f"\nEvidence: {evidence}" if evidence else ""
    text = (
        f"{dish.title()} {lead} ({confidence}% confidence).{evidence_line}\n\n"
        "Want nutrients, similar dishes, or nearby options?"
    )
    buttons = [
        {"id": BTN_DISH_NUTRIENTS, "title": "🧠 Nutrients"},
        {"id": BTN_DISH_SIMILAR, "title": "🥗 Similar dishes"},
        {"id": BTN_DISH_FIND_NEARBY, "title": "📍 Find nearby"},
        {"id": BTN_DISH_UPLOAD_ANOTHER, "title": "🔁 Upload another"},
    ] + GLOBAL_EXIT_BUTTONS
    context.flow = STATE_DISH_WIZARD_REVIEW
    return [OutgoingMessage(text=text, buttons=buttons)]


def _dish_wizard_nutrients(context: UserContext) -> List[OutgoingMessage]:
    text = (
        "General nutrient view (estimate):\n"
        "- Protein: moderate to high\n"
        "- Fiber: moderate to high\n"
        "- Saturated fat: usually lower than meat dishes\n\n"
        "Exact values depend on ingredients and oil quantity."
    )
    buttons = [
        {"id": BTN_DISH_SIMILAR, "title": "🥗 Similar dishes"},
        {"id": BTN_DISH_UPLOAD_ANOTHER, "title": "🔁 Upload another"},
    ] + GLOBAL_EXIT_BUTTONS
    context.flow = STATE_DISH_WIZARD_REVIEW
    return [OutgoingMessage(text=text, buttons=buttons)]


def _dish_wizard_similar(context: UserContext) -> List[OutgoingMessage]:
    text = "You may also like:\n\n" + _format_wizard_recommendations(context.wizard_recommendations)
    buttons = [
        {"id": BTN_DISH_FIND_NEARBY, "title": "📍 Nearby"},
        {"id": BTN_DISH_UPLOAD_ANOTHER, "title": "🔁 Another photo"},
    ] + GLOBAL_EXIT_BUTTONS
    context.flow = STATE_DISH_WIZARD_REVIEW
    return [OutgoingMessage(text=text, buttons=buttons)]


def _dish_wizard_low_confidence(context: UserContext) -> List[OutgoingMessage]:
    context.flow = STATE_DISH_WIZARD_WAIT_IMAGE
    context.step = 1
    context.wizard_veg_status = None
    context.wizard_confidence = 0.0
    context.wizard_recommendation_type = None
    context.wizard_recommendations = []
    context.wizard_evidence = []
    context.wizard_cuisine = ""
    text = (
        "I am not fully sure about this dish.\n"
        "Please upload a clearer photo, or type the dish name."
    )
    buttons = [
        {"id": BTN_DISH_UPLOAD_AGAIN, "title": "📸 Upload again"},
        {"id": BTN_DISH_TYPE_NAME, "title": "✍️ Type dish name"},
        {"id": BTN_DISH_CANCEL, "title": "❌ Cancel"},
    ] + GLOBAL_EXIT_BUTTONS
    return [OutgoingMessage(text=text, buttons=buttons)]


def _celebrate_swap_success(context: UserContext) -> List[OutgoingMessage]:
    text = (
        "Nice choice 🙌\n"
        "Trying this once a week can roughly save:\n"
        "💧 Water for 2 days\n"
        "🐔 ~1 animal/month\n\n"
        "Want another swap?"
    )
    buttons = [
        {"id": BTN_TRY_ANOTHER, "title": "🔁 Another dish"},
        {"id": BTN_FIND_RESTAURANTS, "title": "🍽️ Restaurants"},
    ]
    context.flow = STATE_IDLE
    context.step = 0
    return [OutgoingMessage(text=text, buttons=buttons)]


def _ai_rewrite_response(
    client: OpenRouterClient,
    context: UserContext,
    message: OutgoingMessage,
) -> OutgoingMessage:
    """Pass the crafted reply through the LLM to keep all responses AI-generated and on-brand."""

    context_summary = (
        f"Flow: {context.flow}; step: {context.step}; last dish: {context.last_dish or 'unknown'}; "
        f"preferences: diet={context.preferences.diet or '-'}, taste={context.preferences.taste or '-'}, "
        f"budget={context.preferences.budget or '-'}; restrictions={', '.join(sorted(context.preferences.restrictions)) or '-'}; "
        f"allergies={', '.join(sorted(context.preferences.allergies)) or '-'}"
    )

    rewrite_prompt = (
        "You are OFFRAMP on WhatsApp. Rewrite the assistant reply below into a single, fully AI-generated WhatsApp message. "
        "Keep it short, friendly, and complete; follow the OFFRAMP rules (no repeated intros, no menus unless asked, plant-based focus, step-by-step help). "
        "Do not drop the core info. If buttons are present, keep the text compatible with them."
        f"\nContext: {context_summary}\n\nOriginal reply:\n{message.text}"
    )

    ai_reply = client.complete([{"role": "user", "content": rewrite_prompt}])
    return OutgoingMessage(text=ai_reply.strip(), buttons=message.buttons)


def _build_default_maps_url(area: str, diet: Optional[str], restrictions: set[str]) -> str:
    restriction_set = {x.strip().lower() for x in restrictions}
    diet_value = (diet or "").strip().lower()
    if diet_value == "vegan":
        query = f"vegan restaurants near {area}"
    elif "jain" in restriction_set:
        query = f"jain vegetarian restaurants near {area}"
    else:
        query = f"vegetarian restaurants near {area}"
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus(query)}"


def _restaurant_search_signature(context: UserContext) -> Tuple[str, str, str, str]:
    area = (context.preferences.area or "").strip().lower()
    diet = (context.preferences.diet or "").strip().lower()
    budget = (context.preferences.budget or "").strip().lower()
    restrictions = ",".join(sorted(x.strip().lower() for x in context.preferences.restrictions if x.strip()))
    return (area, diet, budget, restrictions)


def _fallback_restaurant_results(area: str) -> List[Dict[str, Any]]:
    return [
        {
            "name": "Green Leaf Cafe",
            "rating": None,
            "address": area,
            "phone": None,
            "website": None,
            "maps_url": _build_default_maps_url(area, "vegetarian", set()),
        },
        {
            "name": "Terra Vegan Kitchen",
            "rating": None,
            "address": area,
            "phone": None,
            "website": None,
            "maps_url": _build_default_maps_url(area, "vegan", set()),
        },
        {
            "name": "Sattvik Bistro",
            "rating": None,
            "address": area,
            "phone": None,
            "website": None,
            "maps_url": _build_default_maps_url(area, "vegetarian", set()),
        },
        {
            "name": "Jain Delight House",
            "rating": None,
            "address": area,
            "phone": None,
            "website": None,
            "maps_url": _build_default_maps_url(area, "vegetarian", {"jain"}),
        },
        {
            "name": "Urban Veg Table",
            "rating": None,
            "address": area,
            "phone": None,
            "website": None,
            "maps_url": _build_default_maps_url(area, "vegetarian", set()),
        },
    ]


def _merge_restaurant_results(
    primary: List[Dict[str, Any]],
    fallback: List[Dict[str, Any]],
    limit: int,
) -> List[Dict[str, Any]]:
    merged: List[Dict[str, Any]] = []
    seen: set[Tuple[str, str]] = set()

    for item in primary + fallback:
        if not isinstance(item, dict):
            continue
        key = (
            str(item.get("name") or "").strip().lower(),
            str(item.get("address") or "").strip().lower(),
        )
        if not key[0]:
            continue
        if key in seen:
            continue
        seen.add(key)
        merged.append(item)
        if len(merged) >= limit:
            break

    return merged


def _format_restaurant_results_text(
    area: str,
    results: List[Dict[str, Any]],
    focus_dish: Optional[str],
    source_note: Optional[str] = None,
) -> str:
    lines: List[str] = [f"Here are options near {area}:"]
    if focus_dish:
        lines.append(f"Keeping {focus_dish} in mind.")
    if source_note:
        lines.append(source_note)
    lines.append("")

    for idx, item in enumerate(results[:5], start=1):
        name = str(item.get("name") or f"Option {idx}").strip()
        rating = item.get("rating")
        rating_text = ""
        if isinstance(rating, (int, float)):
            rating_text = f" ({float(rating):.1f}★)"
        address = str(item.get("address") or "Address not listed").strip()
        lines.append(f"{idx}. {name}{rating_text}")
        lines.append(f"- {address}")

    lines.append("")
    lines.append("Use Open Maps for directions, then call to confirm dietary handling.")
    return "\n".join(lines)


def _start_find_food_flow(context: UserContext, carry_dish: Optional[str] = None) -> List[OutgoingMessage]:
    context.flow = STATE_FIND_WAIT_AREA
    context.step = 1
    existing_focus = context.pending.get("focus_dish")
    context.pending.clear()
    if carry_dish:
        context.pending["focus_dish"] = carry_dish
    elif isinstance(existing_focus, str) and existing_focus.strip():
        context.pending["focus_dish"] = existing_focus.strip()
    return [OutgoingMessage(text="Got it. Which area are you in?")]


def _process_area_submission(context: UserContext, area: str) -> List[OutgoingMessage]:
    cleaned_area = area.strip()
    if not cleaned_area:
        context.flow = STATE_FIND_WAIT_AREA
        context.step = 1
        return [OutgoingMessage(text="Please share your area or pincode so I can find nearby options.")]

    context.preferences.area = cleaned_area
    context.pending.pop("restaurant_results", None)
    context.pending.pop("restaurant_signature", None)
    context.pending.pop("restaurant_results_live", None)
    context.flow = STATE_FIND_WAIT_RULE
    context.step = 2
    return [
        OutgoingMessage(
            text="Any food rules I should follow?",
            buttons=[
                {"id": BTN_RULE_VEGETARIAN, "title": "🟢 Vegetarian"},
                {"id": BTN_RULE_VEGAN, "title": "🌱 Vegan"},
                {"id": BTN_RULE_JAIN, "title": "🧄 Jain"},
                {"id": BTN_RULE_ALLERGIES, "title": "⚠️ Allergies"},
                {"id": BTN_RULE_NONE, "title": "➡️ No preference"},
            ],
        )
    ]


def _show_restaurant_results(context: UserContext) -> List[OutgoingMessage]:
    area = (context.preferences.area or "").strip()
    if not area:
        context.flow = STATE_FIND_WAIT_AREA
        context.step = 1
        return [OutgoingMessage(text="I need your area first. Tell me your area or pincode.")]

    target_count = 5
    signature = _restaurant_search_signature(context)
    cached_signature = context.pending.get("restaurant_signature")
    cached_results = context.pending.get("restaurant_results")
    cached_live = bool(context.pending.get("restaurant_results_live"))
    source_note: Optional[str] = None
    if (
        cached_signature == signature
        and isinstance(cached_results, list)
        and len(cached_results) >= target_count
        and cached_live
    ):
        results = cached_results
    else:
        live_count = 0
        try:
            results = fetch_nearby_restaurants(
                area,
                diet=context.preferences.diet,
                restrictions=context.preferences.restrictions,
                budget=context.preferences.budget,
                limit=target_count,
            )
            live_count = len(results)
        except NearbySearchError as error:
            logger.warning("Nearby search failed for area=%s: %s", area, error)
            results = []
            source_note = "Live lookup is unavailable right now. Showing safe fallback options."

        fallback_results = _fallback_restaurant_results(area)
        if not results:
            results = fallback_results
            if not source_note:
                source_note = "Could not find enough live listings for this area. Showing fallback options."
        elif len(results) < target_count:
            results = _merge_restaurant_results(results, fallback_results, limit=target_count)
            source_note = "Showing best live matches plus safe fallback options."

        results = results[:target_count]
        context.pending["restaurant_results"] = results
        context.pending["restaurant_signature"] = signature
        context.pending["restaurant_results_live"] = live_count > 0

    focus = context.pending.get("focus_dish")
    focus_dish = focus if isinstance(focus, str) else None
    text = _format_restaurant_results_text(area, results, focus_dish, source_note=source_note)

    context.flow = STATE_FIND_RESULTS
    context.step = 3
    return [
        OutgoingMessage(
            text=text,
            buttons=[
                {"id": BTN_CALL_RESTAURANT, "title": "Call restaurant"},
                {"id": BTN_OPEN_MAPS, "title": "Open Maps"},
                {"id": BTN_MORE_FILTERS, "title": "More filters"},
                {"id": BTN_NEW_SEARCH, "title": "New search"},
            ],
        )
    ]


def _handle_set_rules_buttons(context: UserContext, button_id: str) -> List[OutgoingMessage]:
    if context.step == 1:
        if button_id == BTN_DIET_VEGAN:
            context.preferences.diet = "vegan"
        elif button_id == BTN_DIET_VEGETARIAN:
            context.preferences.diet = "vegetarian"
        elif button_id == BTN_DIET_FLEX:
            context.preferences.diet = "flex"
        else:
            return []
        context.step = 2
        return [
            OutgoingMessage(
                text="Great. Any restrictions?",
                buttons=[
                    {"id": BTN_RESTRICTION_JAIN, "title": "🧄 Jain"},
                    {"id": BTN_RESTRICTION_ALLERGIES, "title": "⚠️ Allergies"},
                    {"id": BTN_RESTRICTION_RELIGIOUS, "title": "✝️ / ☪️ Religious"},
                    {"id": BTN_RESTRICTION_NONE, "title": "➡️ None"},
                ],
            )
        ]

    if context.step == 2:
        if button_id == BTN_RESTRICTION_JAIN:
            context.preferences.restrictions.add("jain")
        elif button_id == BTN_RESTRICTION_RELIGIOUS:
            context.preferences.restrictions.add("religious")
        elif button_id == BTN_RESTRICTION_ALLERGIES:
            return _start_allergy_flow(context, return_flow=STATE_SET_RULES)
        elif button_id == BTN_RESTRICTION_NONE:
            context.preferences.restrictions.discard("religious")
        else:
            return []
        context.step = 3
        return [
            OutgoingMessage(
                text="Noted. What flavour profile do you enjoy?",
                buttons=[
                    {"id": BTN_TASTE_SPICY, "title": "🌶️ Spicy"},
                    {"id": BTN_TASTE_MILD, "title": "😌 Mild"},
                    {"id": BTN_TASTE_RICH, "title": "🧈 Rich & creamy"},
                ],
            )
        ]

    if context.step == 3:
        if button_id == BTN_TASTE_SPICY:
            context.preferences.taste = "spicy"
        elif button_id == BTN_TASTE_MILD:
            context.preferences.taste = "mild"
        elif button_id == BTN_TASTE_RICH:
            context.preferences.taste = "rich"
        else:
            return []
        context.step = 4
        return [
            OutgoingMessage(
                text="Last bit — what budget should I aim for?",
                buttons=[
                    {"id": BTN_BUDGET_LOW, "title": "💸 Low"},
                    {"id": BTN_BUDGET_MEDIUM, "title": "💰 Medium"},
                    {"id": BTN_BUDGET_PREMIUM, "title": "💎 Premium"},
                ],
            )
        ]

    if context.step == 4:
        if button_id == BTN_BUDGET_LOW:
            context.preferences.budget = "low"
        elif button_id == BTN_BUDGET_MEDIUM:
            context.preferences.budget = "medium"
        elif button_id == BTN_BUDGET_PREMIUM:
            context.preferences.budget = "premium"
        else:
            return []
        context.flow = STATE_IDLE
        context.step = 0
        return [
            OutgoingMessage(
                text=(
                    "All set ✅\nI’ll remember this for future suggestions.\n\nYou can now:"
                ),
                buttons=[
                    {"id": BTN_REPLACE_DISH, "title": "🔁 Replace a dish"},
                    {"id": BTN_FIND_NEARBY, "title": "🍽️ Find food"},
                    {"id": BTN_CHANGE_PREFERENCES, "title": "❌ Change preferences"},
                ],
            )
        ]

    return []


def _start_set_rules_flow(context: UserContext) -> List[OutgoingMessage]:
    context.flow = STATE_SET_RULES
    context.step = 1
    context.pending.clear()
    return [
        OutgoingMessage(
            text=(
                "Let’s set this once so I don’t ask again 🙂\n\nPick what applies to you:"
            ),
            buttons=[
                {"id": BTN_DIET_VEGAN, "title": "🌱 Vegan"},
                {"id": BTN_DIET_VEGETARIAN, "title": "🟢 Vegetarian"},
                {"id": BTN_DIET_FLEX, "title": "🍗 Non-veg ok"},
            ],
        )
    ]


def _explain_how_it_works(context: UserContext) -> List[OutgoingMessage]:
    context.flow = STATE_IDLE
    context.step = 0
    text = (
        "OFFRAMP helps you eat better without forcing change 🌱\n\n"
        "• You tell me what you eat\n"
        "• I suggest familiar alternatives\n"
        "• I respect Jain, vegan & allergy rules\n"
        "• You choose — no pressure\n\n"
        "Ready to try?"
    )
    buttons = [
        {"id": BTN_REPLACE_DISH, "title": "🔁 Replace a dish"},
        {"id": BTN_FIND_NEARBY, "title": "🍽️ Find food"},
    ]
    return [OutgoingMessage(text=text, buttons=buttons)]


def _start_allergy_flow(context: UserContext, return_flow: Optional[str] = None) -> List[OutgoingMessage]:
    context.flow = STATE_ALLERGY
    context.step = 1
    if return_flow:
        context.pending["return_flow"] = return_flow
    else:
        context.pending.pop("return_flow", None)
    return [
        OutgoingMessage(
            text="Thanks for telling me 🙏\nWhich allergy should I watch for?",
            buttons=[
                {"id": BTN_ALLERGY_PEANUT, "title": "🥜 Peanuts"},
                {"id": BTN_ALLERGY_DAIRY, "title": "🥛 Dairy"},
                {"id": BTN_ALLERGY_GLUTEN, "title": "🌾 Gluten"},
                {"id": BTN_ALLERGY_SHELLFISH, "title": "🍤 Shellfish"},
                {"id": BTN_ALLERGY_OTHER, "title": "✍️ Other"},
            ],
        )
    ]


def _process_custom_allergy(context: UserContext, name: str) -> List[OutgoingMessage]:
    context.preferences.allergies.add(name.strip().lower())
    return _allergy_caution_message(context)


def _allergy_caution_message(context: UserContext) -> List[OutgoingMessage]:
    context.flow = STATE_ALLERGY
    context.step = 1
    text = (
        "⚠️ Important\n"
        "I’ll avoid risky suggestions. Always confirm with restaurants —"
        " I can’t guarantee kitchen practices.\n\nWant safer options now?"
    )
    buttons = [
        {"id": BTN_SAFE_YES, "title": "✅ Yes"},
        {"id": BTN_SAFE_CHANGE, "title": "🔁 Change allergy"},
    ]
    return [OutgoingMessage(text=text, buttons=buttons)]


def _resume_post_allergy(context: UserContext) -> List[OutgoingMessage]:
    return_flow = context.pending.pop("return_flow", None)
    if return_flow == STATE_FIND_WAIT_RULE:
        return _show_restaurant_results(context)
    if return_flow == STATE_SET_RULES:
        context.step = 3
        return [
            OutgoingMessage(
                text="Got it. What flavour profile do you enjoy?",
                buttons=[
                    {"id": BTN_TASTE_SPICY, "title": "🌶️ Spicy"},
                    {"id": BTN_TASTE_MILD, "title": "😌 Mild"},
                    {"id": BTN_TASTE_RICH, "title": "🧈 Rich & creamy"},
                ],
            )
        ]
    context.flow = STATE_IDLE
    context.step = 0
    return [_fallback_message(context)]


def _fallback_message(context: UserContext) -> OutgoingMessage:
    context.flow = STATE_IDLE
    context.step = 0
    return OutgoingMessage(
        text="I didn’t fully catch that 😅\nWhat would you like to do?",
        buttons=FALLBACK_BUTTONS,
    )


# ----- Delivery helpers --------------------------------------------------------


def _deliver_response(
    whatsapp: MetaWhatsAppClient,
    to: str,
    response: OutgoingMessage,
) -> None:
    buttons = response.buttons or []
    if not buttons:
        try:
            whatsapp.send_text(to, response.text)
        except MetaWhatsAppError as error:
            logger.exception("Failed sending WhatsApp reply to %s: %s", to, error)
        return

    chunks = [buttons[i : i + 3] for i in range(0, len(buttons), 3)]
    for index, chunk in enumerate(chunks):
        body = response.text if index == 0 else "More options 👇"
        try:
            whatsapp.send_interactive_buttons(to, body, chunk)
        except (MetaWhatsAppError, ValueError) as error:
            logger.exception("Button send failed to %s: %s", to, error)
            try:
                fallback_text = response.text + "\n\n" + "\n".join(
                    f"• {btn['title']}" for btn in buttons
                )
                whatsapp.send_text(to, fallback_text)
            except MetaWhatsAppError as send_error:
                logger.exception("Fallback send failed to %s: %s", to, send_error)
            break


def _iterate_incoming_messages(payload: dict) -> Iterator[IncomingMessage]:
    entries = payload.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            for message in messages:
                sender = message.get("from")
                if not sender:
                    continue
                msg_type = message.get("type")
                if msg_type == "text":
                    text = (message.get("text", {}).get("body") or "").strip()
                    if text:
                        yield IncomingMessage(
                            sender=sender,
                            type="text",
                            text=text,
                            message_id=message.get("id"),
                        )
                elif msg_type == "interactive":
                    interactive = message.get("interactive", {})
                    if interactive.get("type") == "button_reply":
                        button = interactive.get("button_reply", {})
                        yield IncomingMessage(
                            sender=sender,
                            type="button",
                            text=button.get("title", ""),
                            message_id=message.get("id"),
                            button_id=button.get("id"),
                            button_title=button.get("title"),
                        )
                    elif interactive.get("type") == "list_reply":
                        reply = interactive.get("list_reply", {})
                        yield IncomingMessage(
                            sender=sender,
                            type="button",
                            text=reply.get("title", ""),
                            message_id=message.get("id"),
                            button_id=reply.get("id"),
                            button_title=reply.get("title"),
                        )
                elif msg_type == "image":
                    image = message.get("image", {})
                    caption = (image.get("caption") or "").strip()
                    media_id = image.get("id")
                    yield IncomingMessage(
                        sender=sender,
                        type="image",
                        text=caption,
                        message_id=message.get("id"),
                        media_id=media_id,
                        media_type="image",
                    )
