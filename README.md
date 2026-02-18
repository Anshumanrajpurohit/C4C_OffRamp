# C4C OffRamp: Web-First Plant-Based Transition Platform

C4C OffRamp is a web-first platform that helps non-vegetarian and flexitarian users transition toward plant-based eating through practical dish substitutions.

OffRamp currently runs as:
- A primary web product (`offramp/`) for full discovery, profile setup, and swap workflows
- A WhatsApp companion (`WhatsApp_Bot/`) for conversational guidance and quick interactions

OffRamp roadmap includes future native mobile applications (Android/iOS) built on the same core recommendation and profile services.

## Core Capabilities

- Dish-to-dish substitution engine for familiar non-veg to plant-based alternatives
- Cultural and regional relevance for Indian food contexts
- Guided AI explanations for taste, texture, nutrition, and preparation fit
- User accounts and preference-aware recommendations
- Indicative impact messaging designed to be practical and non-inflated

## Platform Model

- Web-first: main user journey and primary product surface
- WhatsApp companion: secondary, conversational support channel
- Mobile apps (planned): future phase for on-the-go access and engagement

## Tech Stack

- Frontend: Next.js, React, TypeScript
- Backend services: Supabase + FastAPI recommendation engine
- WhatsApp channel: Flask webhook bot + Meta WhatsApp Cloud API
- AI layer: OpenRouter-backed assistant flows with guardrails

## Quick Start (Web App)

1. Clone the repository:

```bash
git clone https://github.com/Anshumanrajpurohit/C4C_OffRamp.git
cd C4C_OffRamp/offramp
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up database/auth config using `offramp/SUPABASE_SETUP.md`.

5. Run locally:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## WhatsApp Companion (Optional)

The WhatsApp bot code lives in `WhatsApp_Bot/`. Configure Meta and OpenRouter credentials there, then run the Flask webhook service for companion interactions.

## Project Structure

```text
C4C_OffRamp/
|-- offramp/        # Primary web application (web-first)
|-- plant-search/   # Recommendation/search backend
|-- WhatsApp_Bot/   # WhatsApp companion service
|-- OffDataDr.txt   # Current project condition report
`-- README.md
```

## Roadmap Note

Mobile applications are planned as a future product phase. Current implementation focus remains the web-first experience and WhatsApp companion channel.
