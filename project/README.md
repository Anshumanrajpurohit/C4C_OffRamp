# Plant-Based Food Transition Platform

Deterministic companion that helps non-vegetarian users move toward vegetarian, vegan, or Jain meals by relying exclusively on the curated dataset found at `data/output-recipe.json`. The system never invents dishes, ingredients, or nutrition data.

## Project Structure

```
project/
├── data/
│   └── output-recipe.json        # single source of truth copied from ops dataset
├── backend/
│   ├── app.py                    # FastAPI entry point
│   ├── agent.py                  # FoodTransitionAgent and orchestrator helpers
│   ├── data_loader.py            # safe dataset access + atomic updates
│   ├── filters.py                # vegetarian, vegan, Jain rule enforcement
│   ├── recommender.py            # ranking heuristics + LLM-rescoring hook
│   └── youtube_tool.py           # controlled YouTube backfill utility
├── frontend/
│   ├── index.html                # UI shell
│   ├── styles.css                # intentional layout + typography
│   ├── script.js                 # browser logic + API calls
│   └── assets/ingredient-placeholder.svg
├── .env                          # OpenRouter credentials (never checked in)
├── requirements.txt              # backend dependencies
└── README.md
```

## Dataset Rules

- All dish metadata originates from `data/output-recipe.json`.
- Dish names, nutrition values, and images are read-only.
- The platform may only append a `youtube_url` field when a verified tutorial is found via the YouTube Data API.
- Any entry failing a dietary rule (meat, seafood, dairy/eggs for vegan, alliums/root vegetables for Jain) is filtered immediately.

## Backend Overview

The backend is a FastAPI service exposing:

- `GET /recipes?diet=vegetarian&query=chicken` → returns **only dish names** ranked for the requested transition.
- `GET /recipes/{slug_or_name}` → returns the full detail payload, triggers YouTube backfill when `youtube_url` is missing, and never fabricates nutrition data.

### Agent Flow

1. **DataLoader** loads recipes while keeping metadata entries intact for persistence.
2. **FilterEngine** enforces vegetarian/vegan/Jain restrictions via keyword inspection.
3. **RecommendationRanker** scores dishes using protein proximity, cooking style familiarity, and query alignment. When `OPENROUTER_*` variables are set, **TransitionReasoner** asks OpenRouter to reorder the top candidates.
4. **YouTubeBackfillTool** checks the selected dish. If `youtube_url` is absent and `YOUTUBE_API_KEY` exists, it performs a YouTube Data API search for `<dish_name> recipe`, stores the resulting URL, and returns it to the caller.
5. **UIResponseFormatter** converts the raw record into deterministic structures for the frontend.

### Environment Variables

Create `.env` (already scaffolded) and fill in:

```
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct
```

Optional (only required for automatic video backfilling):

```
YOUTUBE_API_KEY=your_youtube_data_api_key
```

Load these before starting the backend, e.g. `set -a && source .env && uvicorn backend.app:app --reload` on Unix shells.

### Running the Backend

```bash
cd project
python -m venv .venv && source .venv/bin/activate  # if needed
pip install -r requirements.txt
uvicorn backend.app:app --reload
```

The service reads `data/output-recipe.json` relative to the `project` directory, so it can run from any environment without extra flags.

## Frontend Overview

`frontend/index.html` is a minimal static page that can be served by any HTTP server (or opened via `file://` during development). Features:

- Search bar + diet dropdown driving `GET /recipes` requests.
- Dish list that only shows dataset names (no extra embellishments).
- Detail pane that displays hero summaries, nutrition chips, ingredient lists (with dataset-provided images when available, otherwise `assets/ingredient-placeholder.svg`), step-by-step instructions, and the YouTube link or a "coming soon" message.

The frontend automatically targets `http://127.0.0.1:8000` (the default uvicorn port) when it is served from another origin such as a static dev server. To point at a different deployment, define `window.API_BASE = "https://your-backend";` before loading `script.js`.

## YouTube Backfilling Lifecycle

1. User selects a dish → frontend requests `/recipes/{slug_or_name}`.
2. Backend inspects the record:
   - If `youtube_url` or `videoId` already exists, it is returned immediately.
   - Otherwise `YouTubeBackfillTool` searches for `<dish_name> recipe` using the YouTube Data API (requires `YOUTUBE_API_KEY`).
   - When a result is found, `DataLoader.persist_recipe` writes the URL back to `data/output-recipe.json` atomically.
3. If no video can be located, the response sets `youtube_url` to `null` so the UI renders "Recipe video coming soon." No fabricated links are ever returned.

## Testing the Flow

1. Start the backend (`uvicorn backend.app:app --reload`).
2. Open `frontend/index.html` in a browser.
3. Choose `Vegetarian`, enter `chicken`, and click **Find dishes**. The list will contain only dataset-backed names ranked for a chicken-to-plant transition.
4. Select a dish to view details, ingredient images/placeholders, and the YouTube link status.

This completes a deterministic, dataset-respecting plant-based transition assistant ready for further integration work.
