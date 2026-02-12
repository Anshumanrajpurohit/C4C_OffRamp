import { NextResponse } from "next/server";
import type { DishDetail } from "@/lib/dishes";

const VEGANSWAP_API_BASE_URL = process.env.VEGANSWAP_API_BASE_URL;

const FALLBACK_IMAGE = "/assets/tempeh-coastal-curry.svg";
const DEFAULT_FLAVOR = "Chef-crafted spice pairing";

type SwapProxyRequest = {
  dishName?: string;
  dietaryRestrictions?: string[];
  texturePreference?: number | null;
};

type SwapSuggestion = {
  id: number;
  name: string;
  score?: number;
};

type VeganSwapRecipe = {
  id: number;
  slug?: string | null;
  name: string;
  diet?: string | null;
  course?: string | null;
  flavor_profile?: string | null;
  taste_profile?: string | null;
  state?: string | null;
  region?: string | null;
  replaces?: unknown;
  ingredients?: unknown;
  steps?: unknown;
  chef_tips?: unknown;
  chefTips?: unknown;
  why_it_works?: string | null;
  hero_summary?: string | null;
  image_url?: string | null;
  categories?: unknown;
  rating?: number | null;
  reviews?: number | null;
  calories?: number | string | null;
  protein?: number | string | null;
  fiber?: number | string | null;
  price_original?: number | null;
  price_swap?: number | null;
  estimated_cost?: number | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  total_time_minutes?: number | null;
  nutritional_data?: Record<string, unknown> | null;
  texture_score?: number | null;
  texture_match?: { similarity_score?: number | string | null } | null;
};

type VeganSwapMeta = {
  appliedRestrictions: string[];
  texturePreference: number | null;
  originalDish: string;
};

const clampScore = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return 0.85;
  }
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric)) {
    return 0.85;
  }
  return Math.min(Math.max(numeric, 0), 1);
};

const formatMinutes = (value?: number | null) => {
  if (!value || value <= 0) {
    return "—";
  }
  return `${value} min`;
};

const parseNumeric = (value?: number | string | null) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const cleaned = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(cleaned) ? cleaned : undefined;
};

const ensureStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).filter((entry) => entry.trim().length > 0);
  }
  return [];
};

const normalizeIngredients = (value: unknown): DishDetail["ingredients"] => {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return { item: entry, quantity: "" };
      }
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        const itemRaw = record.item;
        const quantityRaw = record.quantity;
        const item = typeof itemRaw === "string" ? itemRaw : itemRaw !== undefined ? String(itemRaw) : "";
        const quantity =
          typeof quantityRaw === "string" ? quantityRaw : quantityRaw !== undefined ? String(quantityRaw) : "";
        if (!item.trim() && !quantity.trim()) {
          return null;
        }
        return { item: item || "Ingredient", quantity };
      }
      return null;
    })
    .filter((entry): entry is { item: string; quantity: string } => Boolean(entry));
};

const normalizeSteps = (value: unknown): DishDetail["steps"] => {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry, index) => {
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        if ("instruction" in record) {
          const instructionRaw = record.instruction;
          const timeRaw = record.time;
          return {
            step: Number(record.step ?? index + 1),
            instruction:
              typeof instructionRaw === "string"
                ? instructionRaw
                : instructionRaw !== undefined
                  ? String(instructionRaw)
                  : "",
            time: typeof timeRaw === "string" ? timeRaw : timeRaw !== undefined ? String(timeRaw) : "",
          };
        }
      }
      if (typeof entry === "string") {
        return {
          step: index + 1,
          instruction: entry,
          time: "",
        };
      }
      return null;
    })
    .filter((entry): entry is { step: number; instruction: string; time: string } => Boolean(entry));
};

const mapRecipeToDish = (recipe: VeganSwapRecipe, score?: number): DishDetail => {
  const slug = recipe.slug ?? `veganswap-${recipe.id}`;
  const dietValue = (recipe.diet ?? "vegan").toLowerCase();
  const diet: DishDetail["diet"] =
    dietValue === "jain" ? "jain" : dietValue === "vegetarian" ? "vegetarian" : "vegan";
  const ratingBase = clampScore(score ?? recipe.texture_score ?? recipe.texture_match?.similarity_score ?? null);
  const rating = Number((4 + ratingBase).toFixed(2));

  const totalMinutes =
    typeof recipe.total_time_minutes === "number"
      ? recipe.total_time_minutes
      : typeof recipe.prep_time_minutes === "number" && typeof recipe.cook_time_minutes === "number"
        ? recipe.prep_time_minutes + recipe.cook_time_minutes
        : null;

  return {
    slug,
    name: recipe.name,
    diet,
    course: recipe.course ?? "Main",
    flavorProfile: recipe.flavor_profile ?? recipe.taste_profile ?? DEFAULT_FLAVOR,
    state: recipe.state ?? "Pan-India",
    region: recipe.region ?? recipe.state ?? "Pan-India",
    replaces: ensureStringArray(recipe.replaces),
    ingredients: normalizeIngredients(recipe.ingredients),
    prepTime: formatMinutes(recipe.prep_time_minutes),
    cookTime: formatMinutes(recipe.cook_time_minutes),
    totalTime: formatMinutes(totalMinutes),
    steps: normalizeSteps(recipe.steps),
    chefTips: ensureStringArray(recipe.chef_tips ?? recipe.chefTips),
    whyItWorks: recipe.why_it_works ?? recipe.hero_summary ?? DEFAULT_FLAVOR,
    image: recipe.image_url ?? FALLBACK_IMAGE,
    videoId: undefined,
    categories: ensureStringArray(recipe.categories),
    rating,
    reviews: recipe.reviews ?? Math.round(800 + ratingBase * 400),
    heroSummary: recipe.hero_summary ?? undefined,
    calories: parseNumeric(recipe.calories),
    protein: parseNumeric(recipe.protein),
    fiber: parseNumeric(recipe.fiber),
    priceOriginal: recipe.price_original ?? undefined,
    priceSwap: recipe.price_swap ?? undefined,
    estimatedCost: recipe.estimated_cost ?? undefined,
  };
};

const buildErrorResponse = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(request: Request) {
  if (!VEGANSWAP_API_BASE_URL) {
    return buildErrorResponse("VEGANSWAP_API_BASE_URL is not configured", 500);
  }

  let payload: SwapProxyRequest;
  try {
    payload = await request.json();
  } catch {
    return buildErrorResponse("Invalid JSON payload", 400);
  }

  const dishName = payload.dishName?.trim();
  if (!dishName) {
    return buildErrorResponse("dishName is required", 400);
  }

  const dietaryRestrictions = Array.isArray(payload.dietaryRestrictions)
    ? payload.dietaryRestrictions.map((restriction) => restriction.trim()).filter(Boolean)
    : [];
  const texturePreference =
    typeof payload.texturePreference === "number" && !Number.isNaN(payload.texturePreference)
      ? payload.texturePreference
      : null;

  const baseUrl = VEGANSWAP_API_BASE_URL.replace(/\/$/, "");

  try {
    const swapResponse = await fetch(`${baseUrl}/swap/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dish_name: dishName,
        dietary_restrictions: dietaryRestrictions,
        texture_preference: texturePreference,
      }),
      cache: "no-store",
    });

    if (!swapResponse.ok) {
      console.error("VeganSwap /swap/ error", swapResponse.status, await swapResponse.text());
      return buildErrorResponse("VeganSwap engine returned an error", swapResponse.status);
    }

    const swapBody = await swapResponse.json();
    const suggestions: SwapSuggestion[] = Array.isArray(swapBody?.suggestions) ? swapBody.suggestions : [];

    if (!suggestions.length) {
      return NextResponse.json({
        dishes: [],
        meta: {
          appliedRestrictions: dietaryRestrictions,
          texturePreference,
          originalDish: dishName,
        } satisfies VeganSwapMeta,
      });
    }

    const detailed = await Promise.all(
      suggestions.map(async (suggestion) => {
        try {
          const recipeResponse = await fetch(`${baseUrl}/recipes/${suggestion.id}`);
          if (!recipeResponse.ok) {
            console.warn("Failed to fetch recipe", suggestion.id, recipeResponse.status);
            return null;
          }
          const recipe: VeganSwapRecipe = await recipeResponse.json();
          return mapRecipeToDish(recipe, suggestion.score);
        } catch (error) {
          console.warn("Recipe detail fetch failed", suggestion.id, error);
          return null;
        }
      })
    );

    const dishes = detailed.filter((entry): entry is DishDetail => Boolean(entry));

    return NextResponse.json({
      dishes,
      meta: {
        appliedRestrictions: dietaryRestrictions,
        texturePreference,
        originalDish: dishName,
      } satisfies VeganSwapMeta,
    });
  } catch (error) {
    console.error("VeganSwap proxy failed", error);
    return buildErrorResponse("Unable to reach VeganSwap backend", 502);
  }
}
