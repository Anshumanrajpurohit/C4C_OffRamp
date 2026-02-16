import type { DishDetail } from "@/lib/dishes";

const FALLBACK_IMAGE = "/assets/tempeh-coastal-curry.svg";
const DEFAULT_FLAVOR = "Chef-crafted spice pairing";

const resolveBaseUrl = () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_PLANT_SEARCH_API_BASE_URL?.trim() ||
    process.env.PLANT_SEARCH_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new PlantSearchError("Plant search base URL is not configured. Set NEXT_PUBLIC_PLANT_SEARCH_API_BASE_URL.");
  }
  return baseUrl.replace(/\/$/, "");
};

const debugLog = (label: string, payload: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[PlantSearch] ${label}`, payload);
  }
};

export class PlantSearchError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PlantSearchError";
    this.status = status;
  }
}

export type PlantSearchResult = {
  dish_id: string;
  name: string;
  score: number;
  price_range: string;
  protein: string;
  availability: string;
  reasons: string[];
};

export type PlantDishSummary = {
  id: string;
  name: string;
  category: "vegan" | "non-vegan";
  price_range: string;
  protein: string;
};

export type TasteFeatureSummary = {
  umami_depth: { level: string; source: string[] };
  flavor_base: { primary: string[]; secondary: string[] };
  taste_intensity: { overall: string; complexity: string };
};

export type PlantDishResponse = {
  id: string;
  name: string;
  category: "vegan" | "non-vegan";
  price_range: string;
  availability: string;
  nutrition: { protein: string; energy: string; fat: string };
  taste_features: TasteFeatureSummary;
  texture_features: string[];
  emotion_features: string[];
  created_at: string;
  // Optional full JSON payload from the dataset (if exposed by backend)
  // This mirrors the rich dish structure used by the frontend catalog.
  data?: Record<string, unknown>;
};

export type PlantHealthResponse = {
  status: string;
  dish_count: number;
};

export type SearchAlternativesResponse = {
  dishes: DishDetail[];
  raw: PlantSearchResult[];
};

type RequestOptions = {
  signal?: AbortSignal;
};

type SearchOptions = RequestOptions & {
  dishName: string;
  limit?: number;
};

type GetAllDishesOptions = RequestOptions & {
  category?: "vegan" | "non-vegan";
  protein?: string;
  priceRange?: string;
  name?: string;
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

const sanitizeReasons = (value?: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (entry === null || entry === undefined) return "";
      return String(entry).trim();
    })
    .filter((entry) => entry.length > 0);
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const formatAvailability = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return "Pan-India";
  return trimmed;
};

const coerceDiet = (value: unknown): DishDetail["diet"] => {
  const raw = typeof value === "string" ? value.toLowerCase() : "";
  if (raw === "vegan") return "vegan";
  if (raw === "vegetarian" || raw === "veg") return "vegetarian";
  if (raw === "jain") return "jain";
  return "vegan";
};

const ensureArray = <T>(value: unknown, fallback: T[] = []): T[] => {
  if (!Array.isArray(value)) return fallback;
  return value as T[];
};

const mapPlantSearchResultToDish = (result: PlantSearchResult, originalDish: string): DishDetail => {
  const safeName = result.name?.trim() || "Plant-based swap";
  const slug = result.dish_id ? `plant-${result.dish_id}` : `plant-${toSlug(safeName) || Date.now()}`;
  const scoreBase = clampScore(result.score ?? 0.85);
  const chefNotes = sanitizeReasons(result.reasons);
  const priceRange = result.price_range?.trim();
  const protein = result.protein?.trim();
  const availability = result.availability?.trim();
  const flavorSummary = chefNotes[0] || DEFAULT_FLAVOR;
  const heroSummary = `Match score ${(scoreBase * 100).toFixed(0)}%`;

  const categories = [
    priceRange ? `price:${priceRange.toLowerCase()}` : null,
    protein ? `protein:${protein.toLowerCase()}` : null,
    availability ? `availability:${availability.toLowerCase()}` : null,
    "engine:plant-search",
  ].filter(Boolean) as string[];

  const rating = Number((4.1 + scoreBase * 0.9).toFixed(2));
  const reviews = Math.round(500 + scoreBase * 600);

  return {
    slug,
    name: safeName,
    diet: "vegan",
    course: "Plant-forward main",
    flavorProfile: flavorSummary,
    state: formatAvailability(availability),
    region: formatAvailability(availability),
    replaces: originalDish ? [originalDish] : [],
    ingredients: [],
    prepTime: "—",
    cookTime: "—",
    totalTime: "—",
    steps: [],
    chefTips: chefNotes,
    whyItWorks: chefNotes.join(" • ") || flavorSummary,
    image: FALLBACK_IMAGE,
    videoId: undefined,
    categories,
    rating,
    reviews,
    heroSummary,
    matchMeta: {
      source: "plant-search",
      priceRange,
      protein,
      availability,
      score: scoreBase,
      reasons: chefNotes,
      dishId: result.dish_id ?? slug,
      originalDish,
    },
  };
};

export const mapPlantDishResponseToDishDetail = (response: PlantDishResponse, originalDish?: string): DishDetail => {
  const raw = (response.data ?? {}) as Record<string, unknown>;
  const name = (raw["name"] as string) || response.name || "Plant-based swap";
  const slugBase = (raw["slug"] as string) || toSlug(name) || response.id;
  const diet = coerceDiet(raw["diet"]);

  const ingredients = ensureArray<{ item: string; quantity: string }>(raw["ingredients"], []);
  const steps = ensureArray<{ step: number; instruction: string; time: string }>(raw["steps"], []);
  const chefTips = ensureArray<string>(raw["chefTips"], []);
  const categories = ensureArray<string>(raw["categories"], []);
  const replaces = ensureArray<string>(raw["replaces"], originalDish ? [originalDish] : []);

  const image = (raw["image"] as string) || FALLBACK_IMAGE;
  const heroSummary = (raw["heroSummary"] as string) || `Match score ${(clampScore(1) * 100).toFixed(0)}%`;

  const rating = typeof raw["rating"] === "number" ? (raw["rating"] as number) : 4.6;
  const reviews = typeof raw["reviews"] === "number" ? (raw["reviews"] as number) : 180;

  return {
    slug: slugBase,
    name,
    diet,
    course: (raw["course"] as string) || "Plant-forward main",
    flavorProfile: (raw["flavorProfile"] as string) || DEFAULT_FLAVOR,
    state: (raw["state"] as string) || formatAvailability(response.availability),
    region: (raw["region"] as string) || formatAvailability(response.availability),
    replaces,
    ingredients,
    prepTime: (raw["prepTime"] as string) || "—",
    cookTime: (raw["cookTime"] as string) || "—",
    totalTime: (raw["totalTime"] as string) || "—",
    steps,
    chefTips,
    whyItWorks: (raw["whyItWorks"] as string) || (chefTips.join(" • ") || DEFAULT_FLAVOR),
    image,
    videoId: raw["videoId"] as string | undefined,
    categories,
    rating,
    reviews,
    heroSummary,
    trendingCity: raw["trendingCity"] as string | undefined,
    calories: (raw["calories"] as number | undefined) ?? undefined,
    protein: (raw["protein"] as number | undefined) ?? undefined,
    fiber: (raw["fiber"] as number | undefined) ?? undefined,
    priceOriginal: (raw["priceOriginal"] as number | undefined) ?? undefined,
    priceSwap: (raw["priceSwap"] as number | undefined) ?? undefined,
    estimatedCost: (raw["estimatedCost"] as number | undefined) ?? undefined,
    matchMeta: {
      source: "plant-search",
      priceRange: response.price_range,
      protein: response.nutrition?.protein,
      availability: response.availability,
    },
  };
};

const buildUrl = (path: string, query?: Record<string, string | undefined>) => {
  const url = new URL(`${resolveBaseUrl()}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, value);
      }
    });
  }
  return url.toString();
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    debugLog("response parse error", error);
  }

  if (!response.ok) {
    const message =
      typeof (payload as { error?: string } | null)?.error === "string"
        ? (payload as { error?: string }).error
        : response.statusText;
    throw new PlantSearchError(message || "Plant search request failed", response.status);
  }
  return (payload as T) ?? ({} as T);
};

export const searchPlantAlternatives = async ({ dishName, limit = 9, signal }: SearchOptions): Promise<SearchAlternativesResponse> => {
  const endpoint = buildUrl("/search");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dish_name: dishName, top_n: limit }),
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    debugLog("/search 404", dishName);
    return { dishes: [], raw: [] };
  }

  const payload = await handleResponse<PlantSearchResult[]>(response);
  debugLog("/search", payload);
  return {
    raw: payload,
    dishes: payload.map((item) => mapPlantSearchResultToDish(item, dishName)),
  };
};

export const getAllDishes = async ({ category, protein, priceRange, name, signal }: GetAllDishesOptions = {}) => {
  const endpoint = buildUrl("/dishes", {
    category,
    protein,
    price_range: priceRange,
    name,
  });

  const response = await fetch(endpoint, { cache: "no-store", signal });
  const payload = await handleResponse<PlantDishSummary[]>(response);
  debugLog("/dishes", payload);
  return payload;
};

export const getDish = async (name: string, signal?: AbortSignal) => {
  const safeName = encodeURIComponent(name.trim());
  const endpoint = buildUrl(`/dish/${safeName}`);
  const response = await fetch(endpoint, { cache: "no-store", signal });

  if (response.status === 404) {
    throw new PlantSearchError(`Dish ${name} not found`, 404);
  }

  const payload = await handleResponse<PlantDishResponse>(response);
  debugLog(`/dish/${name}`, payload);
  return payload;
};

export const healthCheck = async (signal?: AbortSignal) => {
  const endpoint = buildUrl("/health");
  const response = await fetch(endpoint, { cache: "no-store", signal });
  const payload = await handleResponse<PlantHealthResponse>(response);
  debugLog("/health", payload);
  return payload;
};
