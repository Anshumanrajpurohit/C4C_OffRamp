# C4C OffRamp Monorepo
C4C OffRamp helps non-vegetarian and flexitarian users transition to plant-forward eating with practical dish swaps. This repository contains the web app, the recommendation API, and a WhatsApp companion bot.

## Table of Contents
- [Key Features](#key-features)
- [Quickstart](#quickstart)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Key Features
- `offramp/`: Next.js web app for onboarding, swap discovery, profile/preferences, and progress.
- `plant-search/`: FastAPI service that ranks alternatives using feature scoring and PostgreSQL-backed dish data.
- `WhatsApp_Bot/`: Flask webhook bot for conversational swap guidance over Meta WhatsApp Cloud API.
- OpenRouter-backed assistant routes for dish chat, suggestions, and cost-savings estimation.

## Quickstart
Fastest path to run the core web + search flow locally:

1. Start the Plant Search API:
```bash
cd plant-search
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --host 127.0.0.1 --port 8000
```

2. Start the web app in another terminal:
```bash
cd offramp
npm install
npm run dev
```

3. Open:
- Web app: `http://localhost:3000`
- Plant Search API docs: `http://localhost:8000/docs`

## Installation
### Prerequisites
- Node.js + npm (Node 20+ recommended; verified here with Node `v24.11.1`).
- Python 3.11+ (verified here with Python `3.12.6` in both Python services).
- Supabase project for auth and user data.
- PostgreSQL access for `plant-search` (service startup requires DB connectivity).
- Optional: Meta WhatsApp Cloud API + OpenRouter credentials for `WhatsApp_Bot`.

### Clone
```bash
git clone https://github.com/Anshumanrajpurohit/C4C_OffRamp.git
cd C4C_OffRamp
```

### Install dependencies
```bash
# Web
cd offramp
npm install

# Plant Search
cd ../plant-search
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# WhatsApp Bot
cd ../WhatsApp_Bot
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Configuration
### Environment variables

### `offramp` (`offramp/.env.local` or `offramp/.env`)
| Name | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | none | Supabase project URL used by web + API routes. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Preferred | none | Supabase publishable key (checked before anon key). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes if no publishable key | none | Supabase anon key fallback. |
| `SUPABASE_URL` | No | none | Fallback private URL key name. |
| `SUPABASE_ANON_KEY` | No | none | Fallback private anon key name. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | none | Required for server/admin operations in API routes. |
| `AUTH_SECRET` | Yes | none | JWT signing secret for login/session routes. |
| `NEXT_PUBLIC_PLANT_SEARCH_API_BASE_URL` | Recommended | `http://127.0.0.1:8000` | Browser-safe plant-search base URL. |
| `PLANT_SEARCH_API_BASE_URL` | No | `http://127.0.0.1:8000` | Server-side plant-search base URL fallback. |
| `OPENROUTER_API_KEY` | Optional | none | Enables AI-powered suggest/chat/cost-savings routes. |
| `OPENROUTER_MODEL` | Optional | route-specific | Model override for OpenRouter-backed routes. |
| `NEXT_PUBLIC_APP_URL` | Optional | `http://localhost:3000` (fallback in routes) | Used for referer/CORS behavior. |
| `CRON_SECRET` | Optional | none | Required only for `/api/transition/reminder`. |
| `EXPRESS_PORT` | Optional | `4000` | Port for legacy `npm run server` Express API. |

### `plant-search` (`plant-search/.env`)
| Name | Required | Default | Description |
|---|---|---|---|
| `TOP_N_DEFAULT` | No | `10` | Default number of recommendations when `top_n` is omitted. |
| `DB_HOST` | Yes in practice | code fallback exists | PostgreSQL host used at API startup. |
| `DB_PORT` | No | `5432` | PostgreSQL port. |
| `DB_NAME` | No | `OffRamp` | PostgreSQL database name. |
| `DB_USER` | No | code fallback exists | PostgreSQL user. |
| `DB_PASSWORD` | Yes in practice | code fallback exists | PostgreSQL password. |

### `WhatsApp_Bot` (`WhatsApp_Bot/.env`)
| Name | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Yes | none | Required for assistant + vision completions. |
| `OPENROUTER_MODEL` | No | `openai/gpt-4o-mini` | OpenRouter model name override. |
| `OPENROUTER_TEMPERATURE` | No | `0.4` | Float temperature used by the assistant. |
| `META_WHATSAPP_TOKEN` | Yes | none | WhatsApp Cloud API access token. |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Yes | none | WhatsApp phone number ID. |
| `META_WHATSAPP_VERIFY_TOKEN` | Yes | none | Webhook verification token. |
| `META_WHATSAPP_API_VERSION` | No | `v19.0` | Graph API version (`v` prefix normalized automatically). |
| `SCRAPINGDOG_API_KEY` | Optional | none | Enables nearby restaurant lookup flow. |
| `SCRAPINGDOG_COUNTRY` | No | `in` | Country hint for nearby restaurant lookup. |

### Config files
- `offramp/SUPABASE_SETUP.md`: Supabase tables/policies and auth setup.
- `offramp/TRANSITION_SETUP.sql`: SQL setup for transition/planning-related tables.
- `offramp/next.config.ts`: Next.js config (includes `externalDir` experiment and build ESLint behavior).

## Usage
### Web app
```bash
cd offramp
npm run dev
```
Open `http://localhost:3000`.

Common paths:
- `/swap` for dish swap search and ranking.
- `/auth` for registration/login.
- `/dashboard`, `/profile`, `/preferences` for user workflows.

### Plant Search API
Base URL: `http://localhost:8000`  
Auth: none

Key endpoints:
- `GET /health`
- `POST /search`
- `GET /dishes`
- `GET /dish/{name}`
- `POST /dish/add`
- `DELETE /dish/{dish_id}`

Example:
```bash
curl http://localhost:8000/health
```

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d "{\"dish_name\":\"Chicken Biryani\",\"top_n\":5,\"from\":\"non-vegan\",\"to\":\"vegan\"}"
```

### OffRamp API routes (inside Next.js app)
Base URL: `http://localhost:3000/api`  
Auth: session cookie for protected routes

Common endpoints:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/session`
- `POST /swaps/record` (requires logged-in session)
- `GET /transition/plan` (requires logged-in session)

Example auth flow:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dev@example.com\",\"password\":\"ExamplePass123\",\"fullName\":\"Dev User\",\"phone\":\"9999999999\"}"

# Login and store cookie
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dev@example.com\",\"password\":\"ExamplePass123\"}"

# Session check
curl -b cookies.txt http://localhost:3000/api/auth/session
```

### WhatsApp bot service
Base URL: `http://localhost:8888`  
Auth:
- Webhook verification requires `hub.verify_token` to match `META_WHATSAPP_VERIFY_TOKEN`.
- Incoming webhook events are posted by Meta to `POST /whatsapp`.

Run:
```bash
cd WhatsApp_Bot
python main.py
```

Health check:
```bash
curl http://localhost:8888/health
```

Webhook verify example:
```bash
curl "http://localhost:8888/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=12345"
```

## Project Structure
```text
C4C_OffRamp/
|-- README.md
|-- offramp/                  # Next.js web app + internal API routes
|   |-- app/                  # App Router pages and API handlers
|   |-- lib/                  # Auth/Supabase shared logic
|   |-- services/             # Plant-search client + transition services
|   |-- src/                  # Legacy Express server and routes
|   |-- package.json
|   |-- SUPABASE_SETUP.md
|   `-- TRANSITION_SETUP.sql
|-- plant-search/             # FastAPI recommendation service
|   |-- api/                  # FastAPI app, routes, models
|   |-- engine/               # Feature extraction, scoring, ranking
|   |-- db/                   # PostgreSQL connection and helpers
|   |-- ui/                   # Static UI served by FastAPI root route
|   `-- requirements.txt
`-- WhatsApp_Bot/             # Flask webhook bot for Meta WhatsApp
    |-- app/                  # Bot flow, Meta client, OpenRouter integration
    |-- main.py               # Flask entrypoint (loads .env)
    |-- system_role.md        # Shared assistant system prompt
    `-- requirements.txt
```

## Development
### Web (`offramp`)
```bash
npm run dev
npm run lint
npm run build
npm run start
npm run server
npm run server:dev
```

### Plant Search (`plant-search`)
```bash
uvicorn api.main:app --host 127.0.0.1 --port 8000
```

### WhatsApp bot (`WhatsApp_Bot`)
```bash
python main.py
```

### Testing, linting, formatting
- `offramp`: `npm run lint` exists (currently reports parser config issues for JS/JSX files outside `tsconfig.json` include list).
- No `test` script is defined in `offramp/package.json`.
- `plant-search` and `WhatsApp_Bot` do not currently ship an automated test suite (`pytest` is not installed in their default venvs).
- No formatter command is defined in this repo.

### Verified command status in this workspace
- `offramp`: `npm run lint` executes but fails due ESLint/TS config mismatch in mixed JS/TS files.
- `offramp`: `npm run dev` returned `spawn EPERM` in this restricted environment.
- `offramp`: `npm run server` failed without expected Supabase env variables.
- `plant-search`: imports cleanly, but API startup fails if PostgreSQL is unreachable.
- `WhatsApp_Bot`: `python main.py` starts successfully on port `8888`.

## Troubleshooting
1. `npm` blocked in PowerShell with execution policy errors:
   Use `npm.cmd ...` in PowerShell or run from Command Prompt.
2. `offramp` commands fail with `spawn EPERM`:
   This can happen in restricted/sandboxed shells; run in a normal local terminal.
3. `npm run server` fails with missing Supabase env vars:
   Ensure env values are available where `src/server.js` expects them (`.env.local` lookup differs from Next.js defaults).
4. `plant-search` fails at startup with PostgreSQL connection errors:
   Check `DB_HOST/DB_PORT` reachability, firewall rules, and credentials.
5. WhatsApp bot throws `META_WHATSAPP_TOKEN is not set`:
   Ensure you run via `python main.py` (which loads `.env`) and that required Meta vars are present.
6. `npm run lint` parser errors mention files not included by TSConfig:
   Update `tsconfig.json` include patterns or narrow ESLint file globs.

## Contributing
No dedicated `CONTRIBUTING.md` is present yet. Use this flow:

1. Create a feature/fix branch.
2. Make scoped changes in the relevant subproject.
3. Run the closest available checks (`npm run lint`, service health checks, startup checks).
4. Open a PR with clear setup/test notes and impacted areas (`offramp`, `plant-search`, `WhatsApp_Bot`).

## License
No root `LICENSE` file is currently present in this repository.
