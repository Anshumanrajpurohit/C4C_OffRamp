import json
import psycopg2
from psycopg2.extras import Json

# =========================
# DATABASE CONFIG
# =========================

DB_CONFIG = {
    "host": "project-db.cluster-clga8ke4eiex.ap-southeast-2.rds.amazonaws.com",
    "database": "OffRamp",
    "user": "dbadmin",
    "password": "sz6pa2ST0BqNS*yT2Y$g",
    "port": 5432
}

# =========================
# FILE PATHS
# =========================

VEGAN_FILE = r"D:/face/plant-search/data/vegan.json"
NONVEGAN_FILE = r"D:/face/plant-search/data/non_vegan.json"


# =========================
# CATEGORY NORMALIZATION
# =========================

def normalize_category(category):

    if not category:
        return None

    c = category.lower().strip()

    if c in ("veg", "vegan"):
        return "vegan"

    if c in ("nonveg", "non veg", "non-vegan", "non_veg"):
        return "non-vegan"

    return c


# =========================
# CONNECT DATABASE
# =========================

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

print("Connected to AWS RDS.")


# =========================
# IMPORT FUNCTION
# =========================

def import_json(file_path):

    print(f"\nImporting: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        dishes = json.load(f)

    inserted = 0
    updated = 0
    ignored = 0

    for dish in dishes:

        dish_id = dish.get("id")

        category = normalize_category(dish.get("category"))

        cur.execute("""
            INSERT INTO dishes (
                id,
                name,
                category,
                price_range,
                availability,
                data,
                taste_features,
                texture_features,
                emotion_features,
                nutrition
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)

            ON CONFLICT (id) DO UPDATE SET

                name = EXCLUDED.name,

                category = EXCLUDED.category,

                price_range = EXCLUDED.price_range,

                availability = EXCLUDED.availability,

                data = EXCLUDED.data,

                taste_features = EXCLUDED.taste_features,

                texture_features = EXCLUDED.texture_features,

                emotion_features = EXCLUDED.emotion_features,

                nutrition = EXCLUDED.nutrition,

                updated_at = NOW()

            WHERE dishes.data IS DISTINCT FROM EXCLUDED.data
        """, (

            dish_id,

            dish.get("name"),

            category,

            dish.get("price_range"),

            dish.get("availability"),

            Json(dish),

            Json(dish.get("taste_features")),

            Json(dish.get("texture_features")),

            Json(dish.get("emotion_features")),

            Json(dish.get("nutrition"))

        ))

        # Detect result
        if cur.rowcount == 1:
            # Could be insert OR update
            cur.execute(
                "SELECT xmax = 0 FROM dishes WHERE id = %s",
                (dish_id,)
            )
            is_insert = cur.fetchone()[0]

            if is_insert:
                inserted += 1
            else:
                updated += 1
        else:
            ignored += 1

    conn.commit()

    print(f"Inserted: {inserted}")
    print(f"Updated : {updated}")
    print(f"Ignored : {ignored}")


# =========================
# RUN IMPORT
# =========================

try:

    import_json(VEGAN_FILE)

    import_json(NONVEGAN_FILE)

    print("\nImport completed successfully.")

except Exception as e:

    print("Error:", e)

finally:

    cur.close()
    conn.close()

    print("Connection closed.")
