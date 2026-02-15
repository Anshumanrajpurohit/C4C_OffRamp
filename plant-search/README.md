# Plant-Based Transition Search Engine

Production-ready FastAPI service that matches non-vegan dishes to high-fidelity vegan alternatives using a deterministic scoring engine. Uses JSON files for data storage with in-memory loading for fast searches. Includes a lightweight UI.

## Prerequisites

- Python 3.10+
- No database required (JSON-based storage)

## Setup

1. **Clone & install**
   ```bash
   cd plant-search
   python -m venv myenv
   myenv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment** (optional)
   ```bash
   cp .env.example .env
   # Edit TOP_N_DEFAULT if needed (default: 10)
   ```

3. **Data is ready**
   - `data/non_vegan.json` contains non-vegan dishes (5 samples included)
   - `data/vegan.json` contains vegan alternatives (25 samples included)
   - Files are loaded into memory on startup

## Running the API

```bash
myenv\Scripts\activate
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

Startup tasks:
- Loads both JSON files into memory
- Preloads all vegan dishes as feature vectors for <200ms searches
- No database connections required

## Frontend

Open `ui/index.html` in your browser while the API runs on `http://localhost:8000`. The page offers autocomplete, filterable cards, and responsive layout with no external dependencies.

## Data Management

### JSON Schema
Each dish in `data/non_vegan.json` or `data/vegan.json` follows this structure:

```json
{
  "id": "V001",
  "name": "Smoky Black Bean Burger",
  "category": "vegan",
  "taste_features": {
    "umami_depth": {
      "level": "strong",
      "source": ["fermented", "soy-based"]
    },
    "seasoning_profile": {
      "salt_level": "high",
      "sweet_level": "low",
      "sour_level": "none",
      "bitter_level": "none",
      "spice_heat": "low"
    },
    "flavor_base": {
      "primary": ["smoky", "garlicky", "earthy"],
      "secondary": ["charred", "peppery"]
    },
    "taste_intensity": {
      "overall": "bold",
      "complexity": "layered"
    },
    "aftertaste": {
      "type": "smoky",
      "duration": "short"
    }
  },
  "texture_features": ["crispy-outside", "chewy", "dense"],
  "emotion_features": ["satisfying", "comfort", "filling"],
  "nutrition": {
    "protein": "high",
    "energy": "high",
    "fat": "low"
  },
  "price_range": "medium",
  "availability": "common"
}
```

### Adding Dishes

**Via API** (recommended - updates file automatically):
```bash
curl -X POST http://localhost:8000/dish/add \
  -H "Content-Type: application/json" \
  -d @new_dish.json
```

**Manually**: Edit `data/vegan.json` or `data/non_vegan.json`, then restart the API to reload data.

## API Reference

| Endpoint | Method | Body | Description |
| --- | --- | --- | --- |
| `/search` | POST | `{ "dish_name": str, "top_n": int }` | Returns ranked vegan dishes with match scores. |
| `/dish/{name}` | GET | – | Full dish payload including all taste features. |
| `/dish/add` | POST | `DishCreate` schema | Inserts a dish, writes to JSON file, updates in-memory data. |
| `/dish/{id}` | DELETE | – | Deletes dish, updates JSON file and memory. |
| `/dishes` | GET | `category`, `protein`, `price_range`, `name` | Filtered list (used by autocomplete). |
| `/health` | GET | – | `{ status: "ok", dish_count: int }`. |

## Scoring Engine

Located in `engine/`:
- `extractor.py`: converts JSON dictionaries into in-memory `DishFeatures`
- `scorer.py`: implements exact-weight rules (umami, seasoning, flavor, intensity, aftertaste)
- `ranker.py`: sorts, slices, and surfaces top match reasons for UI badges

All vegan dishes stay preloaded in `app.state.vegan_dishes`. New dishes added via API are instantly available in searches.

## Architecture Benefits

- **Zero setup**: No database installation required
- **Fast**: All data in memory, <200ms search responses
- **Portable**: JSON files can be version controlled
- **Simple**: Easy to understand, modify, and extend
- **Persistent**: Changes made via API are written back to JSON files

## Testing

1. **Health check**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **Search test**:
   ```bash
   curl -X POST http://localhost:8000/search \
     -H "Content-Type: application/json" \
     -d '{"dish_name": "Chicken Burger", "top_n": 5}'
   ```

3. **List dishes**:
   ```bash
   curl http://localhost:8000/dishes?category=vegan
   ```
