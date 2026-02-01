# OFFRAMP WhatsApp Bot (Python)

A lightweight Flask webhook that wraps the OFFRAMP system prompt, calls OpenRouter, and replies to users through the Meta WhatsApp Cloud API.

## Prerequisites

- Python 3.11+
- Meta Business Account with WhatsApp Cloud API enabled (phone number ID, permanent access token, verification token)
- An OpenRouter API key with access to the configured model

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Export required environment variables:
   ```bash
   export OPENROUTER_API_KEY="your-key"
   export OPENROUTER_MODEL="openai/gpt-4o-mini"  # optional override
   export OPENROUTER_TEMPERATURE="0.4"           # optional override

   export META_WHATSAPP_TOKEN="your-permanent-access-token"
   export META_WHATSAPP_PHONE_NUMBER_ID="123456789012345"
   export META_WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"
   export META_WHATSAPP_API_VERSION="v19.0"       # optional override
   ```
3. Start the development server:
   ```bash
   python main.py
   ```
   The webhook listens on `http://localhost:8000/whatsapp`.

4. Use a tunneling service (e.g., ngrok) and register the public URL plus `/whatsapp` as your WhatsApp Cloud API webhook (subscribe to messages).

## How It Works

- The system prompt lives in `system_role.md` (shared with other channels).
- `app/openrouter.py` loads that prompt, attaches it as the system message, and calls OpenRouter.
- `app/whatsapp_bot.py` keeps a short per-user history (10 turns), verifies the webhook, replies via the WhatsApp Cloud API with interactive buttons, and exposes basic stats at `/`.

## Conversation Flows

The bot mirrors the full OFFRAMP journey:

- Welcome screen with quick replies for dish swaps, nearby food, preference setup, and “How this works”.
- Dish Wizard photo flow: prompts for a food photo, runs OpenRouter vision analysis to classify plant vs non-plant, surfaces swaps, comparisons, allergens, and low-confidence recovery options.
- Dish → plant-based alternative flow with Jain/taste/budget refinements and impact feedback.
- Location-based restaurant finder that respects dietary rules and allergies, with follow-up actions (maps, filters, new search).
- Progressive preference onboarding (diet, restrictions, taste, budget) reused across flows.
- Dedicated allergy safety loop with confirmations and context-aware resumption.
- Friendly fallbacks and re-engagement nudges when input is unclear or idle.
- Negative prompting guardrails: off-mission requests trigger a polite redirect back to food-safe assistance.

## Production Notes

- Persist conversation history in a datastore if you need state across restarts.
- Rotate Meta access tokens or switch to the Graph API token exchange flow for long-lived credentials.
- Configure logging, monitoring, and error notifications to suit your deployment environment.
