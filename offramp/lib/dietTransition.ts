export type NormalizedDiet = "non-vegan" | "veg" | "vegetarian" | "vegan" | "jain" | "keto";

export const DEFAULT_FROM_DIET: NormalizedDiet = "non-vegan";
export const DEFAULT_TO_DIET: NormalizedDiet = "vegan";

export const DEFAULT_FROM_DATASET = "dishes_non_vegan";
export const DEFAULT_TO_DATASET = "dishes_vegan";

const DIET_TO_DATASET: Record<NormalizedDiet, string> = {
  "non-vegan": "dishes_non_vegan",
  veg: "dishes_veg",
  vegetarian: "dishes_veg",
  vegan: "dishes_vegan",
  jain: "dishes_jain",
  keto: "dishes_keto",
};

export const normalizeDiet = (value: string | null | undefined): NormalizedDiet | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "nonveg" || normalized === "non_veg") return "non-vegan";
  if (normalized === "vegeterian") return "vegetarian";
  if (normalized === "non-vegan") return "non-vegan";
  if (normalized === "veg") return "veg";
  if (normalized === "vegetarian") return "vegetarian";
  if (normalized === "vegan") return "vegan";
  if (normalized === "jain") return "jain";
  if (normalized === "keto") return "keto";
  return null;
};

export const resolveDatasetFromDiet = (
  diet: string | null | undefined,
  fallbackDataset: string
): string => {
  const normalized = normalizeDiet(diet);
  if (!normalized) return fallbackDataset;
  return DIET_TO_DATASET[normalized] ?? fallbackDataset;
};

export const formatDietLabel = (diet: string | null | undefined): string => {
  const normalized = normalizeDiet(diet);
  if (!normalized) return "Unknown";
  if (normalized === "non-vegan") return "NON-VEGAN";
  if (normalized === "veg" || normalized === "vegetarian") return "VEG";
  return normalized.toUpperCase();
};

