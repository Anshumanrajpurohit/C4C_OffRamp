from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Deque, Dict, Iterator, List, Optional
from collections import defaultdict, deque

from flask import Flask, Response, jsonify, request

from .config import get_meta_verify_token
from .meta import MetaWhatsAppClient, MetaWhatsAppError
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
    wizard_is_plant: Optional[bool] = None
    wizard_confidence: float = 0.0
    wizard_notes: str = ""


@dataclass
class OutgoingMessage:
    text: str
    buttons: List[Dict[str, str]] = field(default_factory=list)


@dataclass
class IncomingMessage:
    sender: str
    type: str
    text: str = ""
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

NON_VEG_TERMS = {
    "chicken",
    "mutton",
    "fish",
    "prawn",
    "egg",
    "meat",
    "biryani",
    "kebab",
    "butter chicken",
    "keema",
    "lamb",
    "beef",
    "pork",
}

PLANT_TERMS = {
    "chickpea",
    "veg",
    "vegetable",
    "paneer",
    "tofu",
    "soy",
    "soya",
    "jackfruit",
    "mushroom",
    "lentil",
    "dal",
    "rajma",
    "chole",
    "kurma",
}


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
        context.wizard_is_plant = None
        context.wizard_confidence = 0.0
        context.wizard_notes = ""
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
        return [
            OutgoingMessage(
                text="📞 Quick tip: call the place before visiting and double-check Jain/vegan handling. Want me to find another option?",
                buttons=[
                    {"id": BTN_FIND_NEARBY, "title": "🔁 New search"},
                    {"id": BTN_MORE_FILTERS, "title": "🔍 More filters"},
                ],
            )
        ]
    if button_id == BTN_OPEN_MAPS:
        area = context.preferences.area or "your area"
        maps_url = f"https://www.google.com/maps/search/plant-based+restaurants+{area.replace(' ', '+')}"
        return [
            OutgoingMessage(
                text=f"🗺️ Open this in Maps:\n{maps_url}\n\nPing me after you check, I’ll keep options ready.",
                buttons=[
                    {"id": BTN_MORE_FILTERS, "title": "🔍 More filters"},
                    {"id": BTN_NEW_SEARCH, "title": "🔁 New search"},
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
                    {"id": BTN_NEW_SEARCH, "title": "🔁 New search"},
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
        "Hey 👋 I’m OFFRAMP 🌱\n\n"
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

    instruction_lines = [
        "Dish: " + context.last_dish,
        "City: Bangalore",
    ]

    prefs = context.preferences
    if prefs.diet:
        instruction_lines.append(f"Diet: {prefs.diet}")
    if prefs.restrictions:
        instruction_lines.append("Restrictions: " + ", ".join(sorted(prefs.restrictions)))
    if prefs.taste:
        instruction_lines.append(f"Taste: {prefs.taste}")
    if prefs.budget:
        instruction_lines.append(f"Budget: {prefs.budget}")
    if prefs.allergies:
        instruction_lines.append("Allergies: " + ", ".join(sorted(prefs.allergies)))
    if extra_instruction:
        instruction_lines.append(f"Special: {extra_instruction}")

    prompt = (
        "You are OFFRAMP, an Indian plant-forward food assistant."
        " Suggest exactly two plant-based alternatives to the dish above."
        " Reply in under 80 words with this exact format:\n\n"
        "1️⃣ Dish name  \n– short benefit or reason  \n– second benefit focusing on familiarity or texture\n\n"
        "2️⃣ Dish name  \n– short benefit or reason  \n– second benefit focusing on local appeal\n\n"
        "Keep tone warm, Indian, no moralising. Mention local ingredients when easy."
    )

    user_payload = {"role": "user", "content": "\n".join(instruction_lines) + "\n\n" + prompt}
    messages: List[dict[str, str]] = list(context.llm_history) + [user_payload]

    try:
        swap_text = client.complete(messages)
    except (OpenRouterError, RuntimeError) as error:
        logger.exception("Swap generation failed for %s: %s", context.last_dish, error)
        swap_text = (
            "Here are close plant-based swaps 🌱👇\n\n"
            "1️⃣ Soya Chunk Biryani  \n– High protein, familiar bite  \n– Absorbs masala like chicken\n\n"
            "2️⃣ Jackfruit Biryani  \n– Fibrous, meat-like texture  \n– Loved across South India"
        )
    else:
        context.llm_history.append(user_payload)
        context.llm_history.append({"role": "assistant", "content": swap_text})

    context.last_swap_summary = swap_text
    buttons = [
        {"id": BTN_REPLACE_JAIN, "title": "🧄 Jain version"},
        {"id": BTN_REPLACE_TASTE, "title": "🌶️ Spicy / Mild"},
        {"id": BTN_REPLACE_BUDGET, "title": "💸 Budget friendly"},
        {"id": BTN_REPLACE_NEARBY, "title": "📍 Find nearby"},
        {"id": BTN_REPLACE_THIS_WORKS, "title": "👍 This works"},
    ]

    text = f"Here are close plant-based swaps 🌱👇\n\n{swap_text.strip()}\n\nWant to refine this?"
    return [OutgoingMessage(text=text, buttons=buttons)]


def _start_dish_wizard(context: UserContext) -> List[OutgoingMessage]:
    context.flow = STATE_DISH_WIZARD_WAIT_IMAGE
    context.step = 1
    context.pending.clear()
    context.wizard_last_photo_id = None
    context.wizard_last_dish = None
    context.wizard_is_plant = None
    context.wizard_confidence = 0.0
    context.wizard_notes = ""
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
            vision_result = vision.analyze(image_bytes)
        except DishVisionError as error:
            logger.exception("Vision analysis error for %s: %s", incoming.media_id, error)

    if vision_result and vision_result.confidence >= 0.4:
        dish_name = vision_result.name or (hint or "this dish")
        context.wizard_last_dish = dish_name
        context.wizard_is_plant = vision_result.is_plant
        context.wizard_confidence = vision_result.confidence
        context.wizard_notes = vision_result.notes
        context.flow = STATE_DISH_WIZARD_REVIEW
        context.pending["focus_dish"] = dish_name

        if vision_result.is_plant:
            return _dish_wizard_plant_response(context)

        return _dish_wizard_non_veg_response(context)

    classification = _classify_dish_hint(hint)
    if classification is None:
        return _dish_wizard_low_confidence(context)

    dish_name, is_plant, confidence = classification
    context.wizard_last_dish = dish_name
    context.wizard_is_plant = is_plant
    context.wizard_confidence = confidence
    context.wizard_notes = ""
    context.flow = STATE_DISH_WIZARD_REVIEW
    context.pending["focus_dish"] = dish_name

    if is_plant:
        return _dish_wizard_plant_response(context)

    return _dish_wizard_non_veg_response(context)


def _process_manual_dish_input(
    context: UserContext,
    client: OpenRouterClient,
    dish_text: str,
) -> List[OutgoingMessage]:
    classification = _classify_dish_hint(dish_text)
    if classification is None:
        context.wizard_notes = ""
        context.wizard_last_dish = dish_text.strip() or "this dish"
        return _dish_wizard_low_confidence(context)

    dish_name, is_plant, confidence = classification
    context.wizard_last_dish = dish_name
    context.wizard_is_plant = is_plant
    context.wizard_confidence = confidence
    context.wizard_notes = ""
    context.flow = STATE_DISH_WIZARD_REVIEW
    context.pending["focus_dish"] = dish_name

    if is_plant:
        return _dish_wizard_plant_response(context)

    return _dish_wizard_non_veg_response(context)


def _dish_wizard_non_veg_response(context: UserContext) -> List[OutgoingMessage]:
    dish = context.wizard_last_dish or "that dish"
    notes_line = f"Notes: {context.wizard_notes}\n\n" if context.wizard_notes else ""
    text = (
        f"Looks like 🍗 *{dish.title()}*.\n\n"
        "This dish contains:\n"
        "• Meat-based protein\n"
        "• Animal fat\n"
        "• High water & carbon footprint\n\n"
        f"{notes_line}Want plant-based alternatives that feel similar?"
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
    text = (
        "Here are close plant-based alternatives 🌱👇\n\n"
        "1️⃣ Soya Chunk Biryani  \n– Similar protein bite  \n– Absorbs spices like chicken\n\n"
        "2️⃣ Jackfruit Biryani  \n– Fibrous, meat-like texture  \n– South Indian favourite"
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
    text = (
        f"Compared to {dish.title()} 👇\n\n"
        "🌱 Plant-based version:\n"
        "• Lower saturated fat\n"
        "• No animal harm\n"
        "• Significantly less water usage\n"
        "• Easier digestion for many people\n\n"
        "This is approximate, not medical advice."
    )
    buttons = [
        {"id": BTN_DISH_SHOW_SWAPS, "title": "🌱 Show swaps"},
        {"id": BTN_DISH_TRY_PHOTO, "title": "🔁 Another photo"},
    ] + GLOBAL_EXIT_BUTTONS
    context.flow = STATE_DISH_WIZARD_REVIEW
    return [OutgoingMessage(text=text, buttons=buttons)]


def _dish_wizard_allergens(context: UserContext) -> List[OutgoingMessage]:
    text = (
        "Possible allergens to watch for ⚠️\n"
        "• Soy (soya chunks)\n"
        "• Gluten (depending on masala)\n"
        "• Nuts (restaurant-specific)\n\n"
        "Always confirm with the kitchen."
    )
    buttons = [
        {"id": BTN_DISH_SHOW_SWAPS, "title": "🌱 Show swaps"},
        {"id": BTN_DISH_TRY_PHOTO, "title": "🔁 Another photo"},
    ] + GLOBAL_EXIT_BUTTONS
    context.flow = STATE_DISH_WIZARD_REVIEW
    return [OutgoingMessage(text=text, buttons=buttons)]


def _dish_wizard_plant_response(context: UserContext) -> List[OutgoingMessage]:
    dish = context.wizard_last_dish or "this dish"
    notes_line = f"Notes: {context.wizard_notes}\n\n" if context.wizard_notes else ""
    text = (
        f"This looks like 🌱 *{dish.title()}*.\n\n"
        "Good choice 🙌\nHere’s a quick breakdown 👇\n\n"
        "🌿 Benefits:\n"
        "• Plant protein source\n"
        "• High fiber → good digestion\n"
        "• No animal products\n\n"
        "⚠️ Possible allergens:\n"
        "• Legumes / pulses\n"
        "• Spices (varies by recipe)\n\n"
        f"{notes_line}Want more info?"
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
        "Approx nutrients per serving 🍽️\n"
        "• Protein: Moderate\n"
        "• Fiber: High\n"
        "• Fat: Low–medium (depends on oil)\n"
        "• Iron & folate: Present\n\n"
        "Great for regular meals."
    )
    buttons = [
        {"id": BTN_DISH_SIMILAR, "title": "🥗 Similar dishes"},
        {"id": BTN_DISH_UPLOAD_ANOTHER, "title": "🔁 Upload another"},
    ] + GLOBAL_EXIT_BUTTONS
    context.flow = STATE_DISH_WIZARD_REVIEW
    return [OutgoingMessage(text=text, buttons=buttons)]


def _dish_wizard_similar(context: UserContext) -> List[OutgoingMessage]:
    text = (
        "If you like this, you might enjoy 👇\n"
        "• Rajma Masala\n"
        "• Chole\n"
        "• Veg Kurma\n"
        "• Tofu Curry\n\n"
        "Want recipes or nearby places?"
    )
    buttons = [
        {"id": BTN_DISH_FIND_NEARBY, "title": "📍 Nearby"},
        {"id": BTN_DISH_UPLOAD_ANOTHER, "title": "🔁 Another photo"},
    ] + GLOBAL_EXIT_BUTTONS
    context.flow = STATE_DISH_WIZARD_REVIEW
    return [OutgoingMessage(text=text, buttons=buttons)]


def _dish_wizard_low_confidence(context: UserContext) -> List[OutgoingMessage]:
    context.flow = STATE_DISH_WIZARD_WAIT_IMAGE
    context.step = 1
    context.wizard_notes = ""
    text = (
        "I’m not 100% sure about this dish 😅\n"
        "Could you:\n• Upload a clearer photo, or\n• Tell me the dish name?"
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


def _classify_dish_hint(hint: str | None) -> Optional[tuple[str, bool, float]]:
    if not hint:
        return None
    lowered = hint.lower()

    plant_cues = {"veg", "vegan", "plant", "chickpea"}
    if any(token in lowered for token in plant_cues) or any(term in lowered for term in PLANT_TERMS):
        dish_name = hint.strip() or "plant-based dish"
        return dish_name, True, 0.6

    if "non-veg" in lowered or "non veg" in lowered:
        dish_name = hint.strip() or "non-veg dish"
        return dish_name, False, 0.6

    for term in NON_VEG_TERMS:
        if term in lowered:
            dish_name = hint.strip() or term
            return dish_name, False, 0.6

    return None


def _start_find_food_flow(context: UserContext, carry_dish: Optional[str] = None) -> List[OutgoingMessage]:
    context.flow = STATE_FIND_WAIT_AREA
    context.step = 1
    context.pending.clear()
    if carry_dish:
        context.pending["focus_dish"] = carry_dish
    return [OutgoingMessage(text="Got it 📍\nWhich area are you in?")]


def _process_area_submission(context: UserContext, area: str) -> List[OutgoingMessage]:
    context.preferences.area = area.strip()
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
    area = context.preferences.area or "your area"

    tags = []
    if "jain" in context.preferences.restrictions:
        tags.append("✅ Jain-friendly")
    if context.preferences.diet == "vegan":
        tags.append("🌱 100% plant-based")
    elif context.preferences.diet == "vegetarian":
        tags.append("🟢 Pure veg focus")

    tag_line = "\n".join(tags) if tags else "🍽️ Community-loved spots"

    focus = context.pending.get("focus_dish")
    focus_line = f"Keeping {focus} in mind.\n" if focus else ""

    text = (
        f"Here are options near {area} 👇\n\n"
        f"🍽️ Green Leaf Café\n{tag_line}\n⚠️ Confirm during ordering\n\n"
        "🍽️ Terra Vegan\n🌱 Popular Bangalore kitchen\n\n"
        "Want to narrow this?"
    )

    context.flow = STATE_FIND_RESULTS
    context.step = 3
    return [
        OutgoingMessage(
            text=focus_line + text,
            buttons=[
                {"id": BTN_CALL_RESTAURANT, "title": "📞 Call restaurant"},
                {"id": BTN_OPEN_MAPS, "title": "🗺️ Open Maps"},
                {"id": BTN_MORE_FILTERS, "title": "🔍 More filters"},
                {"id": BTN_NEW_SEARCH, "title": "🔁 New search"},
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
                        yield IncomingMessage(sender=sender, type="text", text=text)
                elif msg_type == "interactive":
                    interactive = message.get("interactive", {})
                    if interactive.get("type") == "button_reply":
                        button = interactive.get("button_reply", {})
                        yield IncomingMessage(
                            sender=sender,
                            type="button",
                            text=button.get("title", ""),
                            button_id=button.get("id"),
                            button_title=button.get("title"),
                        )
                    elif interactive.get("type") == "list_reply":
                        reply = interactive.get("list_reply", {})
                        yield IncomingMessage(
                            sender=sender,
                            type="button",
                            text=reply.get("title", ""),
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
                        media_id=media_id,
                        media_type="image",
                    )
