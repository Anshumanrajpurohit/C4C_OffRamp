"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import { useSearchParams } from "next/navigation";
import { DISH_CATALOG, type DishDetail as DishDetailType } from "../../lib/dishes";
import { DishDetail } from "../components/DishDetail";
import { NavAuthButton } from "@/app/components/NavAuthButton";
import {
  PlantSearchError,
  getAllDishes,
  getDish,
  healthCheck,
  searchPlantAlternatives,
  mapPlantDishResponseToDishDetail,
  type PlantDishResponse,
  type PlantHealthResponse,
  type PlantSearchResult,
} from "@/services/plantSearchService";

const impact = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-impact" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});
type Dish = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  restaurant: string;
  category: string;
};

type SortOption = {
  id: string;
  label: string;
  description?: string;
};

type FilterOption = {
  id: string;
  label: string;
  description?: string;
};

type DishMeta = {
  freshnessIndex: number;
  rating: number;
  reviews: number;
  swapCost: number | null;
};

const dishes: Dish[] = [
  {
    id: "paneer-tikka",
    name: "Paneer Tikka",
    image: "/assets/Paneer%20Tikka.jpeg",
    rating: 4.92,
    reviewCount: 1280,
    restaurant: "Grill House",
    category: "North Indian",
  },
  {
    id: "chickpea-masala",
    name: "Chickpea Masala",
    image: "/assets/Chickpea%20Masala.jpeg",
    rating: 4.85,
    reviewCount: 980,
    restaurant: "Spice Route",
    category: "Punjabi",
  },
  {
    id: "mushroom-biryani",
    name: "Mushroom Biryani",
    image: "/assets/Mushroom%20Biryani.jpeg",
    rating: 4.88,
    reviewCount: 1040,
    restaurant: "Nizam's Feast",
    category: "Hyderabadi",
  },
  {
    id: "jackfruit-biryani",
    name: "Jackfruit Biryani",
    image: "/assets/jackfruit-biryani.svg",
    rating: 4.81,
    reviewCount: 760,
    restaurant: "Kashi Kitchens",
    category: "Coastal",
  },
  {
    id: "tofu-butter-masala",
    name: "Tofu Butter Masala",
    image: "/assets/Tofu%20Butter%20Masala.jpeg",
    rating: 4.9,
    reviewCount: 1675,
    restaurant: "Urban Masala",
    category: "Mughlai",
  },
  {
    id: "soya-chunk-biryani",
    name: "Soya Chunk Biryani",
    image: "/assets/Soya%20Chunk%20Biryani.jpeg",
    rating: 4.84,
    reviewCount: 880,
    restaurant: "Hyderabad House",
    category: "Hyderabadi",
  },
  {
    id: "mushroom-pepper-fry",
    name: "Mushroom Pepper Fry",
    image: "/assets/Mushroom%20Pepper%20Fry.jpeg",
    rating: 4.83,
    reviewCount: 910,
    restaurant: "Umami Lab",
    category: "South Indian",
  },
  {
    id: "paneer-bhurji",
    name: "Paneer Bhurji",
    image: "/assets/Paneer%20Bhurji.jpeg",
    rating: 4.79,
    reviewCount: 720,
    restaurant: "Campus Cafe",
    category: "Everyday",
  },
  {
    id: "lentil-cutlets",
    name: "Lentil Cutlets",
    image: "/assets/Lentil%20Cutlets.jpeg",
    rating: 4.76,
    reviewCount: 680,
    restaurant: "Bistro 9",
    category: "Snacks",
  },
  {
    id: "tempeh-curry",
    name: "Tempeh Coastal Curry",
    image: "/assets/tempeh-coastal-curry.svg",
    rating: 4.82,
    reviewCount: 540,
    restaurant: "Coastline",
    category: "Coastal",
  },
  {
    id: "tofu-stir-fry",
    name: "Tofu Stir Fry",
    image: "/assets/tofu-stir-fry.svg",
    rating: 4.74,
    reviewCount: 610,
    restaurant: "Calle Verde",
    category: "Asian",
  },
  {
    id: "veg-kofta",
    name: "Vegetable Kofta Curry",
    image: "/assets/Vegetable%20Kofta%20Curry.jpeg",
    rating: 4.86,
    reviewCount: 940,
    restaurant: "Royal Feast",
    category: "Mughlai",
  },
];

const SEARCH_KEYWORDS = ["chicken", "mutton", "fish", "prawn", "egg", "beef", "lamb", "biryani", "kebab", "tikka"];
const jainKeywords = ["jain", "satvik", "no onion", "no garlic"];

type DietMode = "veg" | "vegan" | "jain";

const DIET_SUGGESTIONS: string[] = [
  "veg",
  "vegetarian",
  "pure veg",
  "vegan",
  "plant based",
  "dairy free",
  "jain",
  "satvik",
  "no onion",
  "no garlic",
];

const getDietModeFromSort = (sortId: string | null): DietMode | null => {
  if (sortId === "veg" || sortId === "vegan" || sortId === "jain") return sortId;
  return null;
};

const stripDietTokens = (input: string) => {
  const original = input ?? "";
  const lower = original.toLowerCase();

  const hasJain =
    /\bjain\b/.test(lower) ||
    /\bsatvik\b/.test(lower) ||
    /\bsattvic\b/.test(lower) ||
    /no\s+onion/.test(lower) ||
    /without\s+onion/.test(lower) ||
    /no\s+garlic/.test(lower) ||
    /without\s+garlic/.test(lower);

  const hasVegan =
    /\bvegan\b/.test(lower) ||
    /plant\s*based/.test(lower) ||
    /dairy\s*free/.test(lower) ||
    /no\s+dairy/.test(lower);

  const hasVeg = /\bveg\b/.test(lower) || /\bvegetarian\b/.test(lower) || /pure\s+veg/.test(lower);

  const mode: DietMode | null = hasJain ? "jain" : hasVegan ? "vegan" : hasVeg ? "veg" : null;

  let cleaned = original;
  const replacements: Array<[RegExp, string]> = [
    [/\bjain\b/gi, " "],
    [/\bsatvik\b/gi, " "],
    [/\bsattvic\b/gi, " "],
    [/\bvegan\b/gi, " "],
    [/plant\s*based/gi, " "],
    [/dairy\s*free/gi, " "],
    [/no\s+dairy/gi, " "],
    [/\bvegetarian\b/gi, " "],
    [/pure\s+veg/gi, " "],
    [/\bveg\b/gi, " "],
    [/no\s+onion/gi, " "],
    [/without\s+onion/gi, " "],
    [/no\s+garlic/gi, " "],
    [/without\s+garlic/gi, " "],
  ];

  for (const [pattern, next] of replacements) {
    cleaned = cleaned.replace(pattern, next);
  }

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return { cleaned, mode };
};

const matchesDietMode = (dish: DishDetailType, mode: DietMode) => {
  if (mode === "vegan") return dish.diet === "vegan";
  if (mode === "veg") return dish.diet === "vegetarian" || dish.diet === "jain";

  const haystack = `${dish.whyItWorks ?? ""} ${dish.heroSummary ?? ""} ${dish.flavorProfile ?? ""}`.toLowerCase();
  return dish.diet === "jain" || jainKeywords.some((kw) => haystack.includes(kw));
};

const keywordToCategoryMap: Record<string, string[]> = {
  chicken: ["chicken"],
  mutton: ["mutton"],
  beef: ["mutton"],
  lamb: ["mutton"],
  fish: ["seafood"],
  prawn: ["seafood"],
  egg: ["egg"],
};

const PLANT_SEARCH_RESTRICTIONS = [
  { id: "gluten_free", label: "Gluten-free" },
  { id: "nut_free", label: "Nut-free" },
  { id: "soy_free", label: "Soy-free" },
  { id: "onion_free", label: "No Onion" },
  { id: "garlic_free", label: "No Garlic" },
];

const DEFAULT_TEXTURE_TARGET = 0.85;

type PlantSearchFilters = {
  dietaryRestrictions: string[];
  texturePreference: number | null;
};

type PlantSearchMeta = {
  appliedRestrictions: string[];
  texturePreference: number | null;
  originalDish?: string;
  engine?: "plant-search";
  priceRanges?: string[];
  proteinTags?: string[];
  availabilityTags?: string[];
};

type PlantRecommendation = {
  id: string;
  name: string;
  protein: string;
  priceRange: string;
  score: number;
  availability: string;
  reasons: string[];
  detail?: DishDetailType;
};

const createEmptySwapMeta = (): PlantSearchMeta => ({
  appliedRestrictions: [],
  texturePreference: null,
  originalDish: undefined,
  engine: undefined,
  priceRanges: [],
  proteinTags: [],
  availabilityTags: [],
});

const summarizeRawResults = (results: PlantSearchResult[]) => {
  const priceRanges = new Set<string>();
  const proteinTags = new Set<string>();
  const availabilityTags = new Set<string>();

  results.forEach((result) => {
    if (result.price_range) priceRanges.add(result.price_range);
    if (result.protein) proteinTags.add(result.protein);
    if (result.availability) availabilityTags.add(result.availability);
  });

  return {
    priceRanges: Array.from(priceRanges),
    proteinTags: Array.from(proteinTags),
    availabilityTags: Array.from(availabilityTags),
  } satisfies Pick<PlantSearchMeta, "priceRanges" | "proteinTags" | "availabilityTags">;
};

const toPlantRecommendation = (result: PlantSearchResult, detail?: DishDetailType): PlantRecommendation => ({
  id: result.dish_id,
  name: result.name,
  protein: result.protein,
  priceRange: result.price_range,
  score: result.score,
  availability: result.availability,
  reasons: result.reasons,
  detail,
});

const formatRestrictionLabel = (value: string) => {
  const match = PLANT_SEARCH_RESTRICTIONS.find((entry) => entry.id === value);
  if (match) {
    return match.label;
  }
  return value.replace(/_/g, " ");
};

const parsePriceToNumber = (value?: string | number | null): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isNaN(numeric) ? null : numeric;
};

const formatMinutesLabel = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/\d+/);
  if (match) return `${match[0]} min`;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const formatCaloriesLabel = (value?: string | number | null) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value} kcal`;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.length) return null;
    const numeric = trimmed.replace(/[^0-9.]/g, "");
    return numeric.length ? `${numeric} kcal` : trimmed;
  }
  return null;
};

const formatItemsLabel = (count?: number | null) => {
  if (typeof count !== "number" || count <= 0) return null;
  return `${count} ${count === 1 ? "item" : "items"}`;
};

const formatViewsLabel = (value?: number | null) => {
  if (typeof value !== "number" || value <= 0) return null;
  const abbreviated = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
  return `${abbreviated} views`;
};

const formatMatchScoreLabel = (score?: number | null) => {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  return `${Math.round(score * 100)}% match`;
};

const normalizeCostValue = (value?: number | string | null) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value.toString();
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return null;
};

function SwapPageInner() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [normalizedSearchTerm, setNormalizedSearchTerm] = useState("");
  const [dietIntent, setDietIntent] = useState<DietMode | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [selectedDish, setSelectedDish] = useState<DishDetailType | null>(null);
  const [costSaved, setCostSaved] = useState<number | null>(null);
  const [costSavedStatus, setCostSavedStatus] = useState<"idle" | "loading" | "error" | "unavailable">("idle");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [texturePreference, setTexturePreference] = useState<number | null>(null);
  const [swapEngineDishes, setSwapEngineDishes] = useState<DishDetailType[]>([]);
  const [swapEngineLoading, setSwapEngineLoading] = useState(false);
  const [swapEngineError, setSwapEngineError] = useState<string | null>(null);
  const [swapEngineMeta, setSwapEngineMeta] = useState<PlantSearchMeta>(() => createEmptySwapMeta());
  const [plantRecommendations, setPlantRecommendations] = useState<PlantRecommendation[]>([]);
  const [engineHealth, setEngineHealth] = useState<PlantHealthResponse | null>(null);
  const [backendDishNames, setBackendDishNames] = useState<string[]>([]);
  const [spotlightDish, setSpotlightDish] = useState<PlantDishResponse | null>(null);
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo");
  const isDemoTable = demoParam === "1" || demoParam === "2";
  const isDemoForm = demoParam === "3";
  const isDemo = isDemoTable || isDemoForm;

  const [region, setRegion] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<number>(2);
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);
  const [prefSaved, setPrefSaved] = useState<string>("");
  const [showCode, setShowCode] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const swapRequestIdRef = useRef(0);

  const cuisineOptions = ["Tamil", "Telugu", "Kerala", "Hyderabadi", "Punjabi", "Gujarati"];
  const allergyOptions = ["Peanuts", "Tree Nuts", "Soy", "Milk", "Eggs", "Sesame"];
  const tasteOptions = ["Spicy", "Savory", "Umami", "Sweet", "Tangy"];

  const dishMeta = useMemo<Record<string, DishMeta>>(() => {
    const total = DISH_CATALOG.length;
    return DISH_CATALOG.reduce((acc, dish, index) => {
      acc[dish.slug] = {
        freshnessIndex: total - index,
        rating: dish.rating ?? 0,
        reviews: dish.reviews ?? 0,
        swapCost: parsePriceToNumber(dish.priceSwap ?? dish.estimatedCost ?? null),
      };
      return acc;
    }, {} as Record<string, DishMeta>);
  }, []);

  const plantForwardCategories = useMemo(() => {
    const tags = new Set<string>();
    DISH_CATALOG.forEach((dish) => {
      (dish.categories || []).forEach((category) => {
        if (/veg|plant|green/.test(category.toLowerCase())) {
          tags.add(category);
        }
      });
    });
    return Array.from(tags);
  }, []);

  const sortOptions = useMemo<SortOption[]>(() => {
    const base: SortOption[] = [
      { id: "veg", label: "Veg", description: "Prioritize vegetarian transitions" },
      { id: "vegan", label: "Vegan", description: "Show vegan dishes first" },
      { id: "jain", label: "Jain", description: "Highlight Jain-friendly swaps" },
    ];
    plantForwardCategories.forEach((tag) => {
      base.push({ id: `tag-${tag}`, label: tag.replace(/-/g, " "), description: "Match detected veg-first category" });
    });
    return base;
  }, [plantForwardCategories]);

  const filterOptions = useMemo<FilterOption[]>(
    () => [
      { id: "new", label: "Newly Updated", description: "Latest recipe refresh" },
      { id: "old", label: "Oldest Updated", description: "Legacy staples" },
      { id: "recommended", label: "Most Recommended", description: "Best-rated swaps" },
      { id: "budget", label: "Budget Friendly", description: "Lower swap cost" },
      { id: "protein_high", label: "High Protein", description: "Engine-verified protein rich" },
      { id: "price_low", label: "Budget Match", description: "Plant engine low price range" },
      { id: "availability_easy", label: "Easy Availability", description: "Common pantry or easy sourcing" },
      { id: "score_elite", label: "Elite Match", description: "95%+ match confidence" },
    ],
    []
  );

  const filterPredicates = useMemo<Record<string, (dish: DishDetailType) => boolean>>(() => {
    const total = DISH_CATALOG.length;
    const newestThreshold = total - Math.max(1, Math.floor(total * 0.3));
    const oldestThreshold = Math.max(1, Math.floor(total * 0.3));

    const isHighProteinDish = (dish?: DishDetailType) => {
      if (!dish) return false;
      const metaProtein = dish.matchMeta?.protein?.toLowerCase();
      if (metaProtein) {
        return metaProtein.includes("high") || metaProtein.includes("power");
      }
      const numericProtein = typeof dish.protein === "number" ? dish.protein : undefined;
      return typeof numericProtein === "number" ? numericProtein >= 15 : false;
    };

    const matchesPriceBand = (dish?: DishDetailType, band: "low" | "premium") => {
      if (!dish) return false;
      const metaPrice = dish.matchMeta?.priceRange?.toLowerCase();
      if (metaPrice) {
        if (band === "low") {
          return metaPrice.includes("low") || metaPrice.includes("budget");
        }
        return metaPrice.includes("premium") || metaPrice.includes("high");
      }
      const price = dishMeta[dish.slug]?.swapCost;
      if (typeof price !== "number") return false;
      return band === "low" ? price <= 180 : price >= 260;
    };

    const hasEasyAvailability = (dish?: DishDetailType) => {
      if (!dish) return false;
      const availability = dish.matchMeta?.availability?.toLowerCase();
      if (availability) {
        return availability.includes("common") || availability.includes("easy") || availability.includes("everyday");
      }
      return true;
    };

    const hasEliteScore = (dish?: DishDetailType) => {
      const score = dish?.matchMeta?.score;
      if (typeof score === "number") {
        return score >= 0.95;
      }
      return false;
    };

    return {
      new: (dish) => (dishMeta[dish.slug]?.freshnessIndex ?? 0) >= newestThreshold,
      old: (dish) => (dishMeta[dish.slug]?.freshnessIndex ?? 0) <= oldestThreshold,
      recommended: (dish) => (dish.rating ?? 0) >= 4.85 || (dish.reviews ?? 0) >= 900,
      budget: (dish) => {
        const price = dishMeta[dish.slug]?.swapCost;
        return typeof price === "number" ? price <= 180 : false;
      },
      protein_high: (dish) => isHighProteinDish(dish),
      price_low: (dish) => matchesPriceBand(dish, "low"),
      availability_easy: (dish) => hasEasyAvailability(dish),
      score_elite: (dish) => hasEliteScore(dish),
    };
  }, [dishMeta]);

  const getSortPriority = (dish?: DishDetailType) => {
    if (!dish || !selectedSort) return 0;
    if (selectedSort === "veg") {
      if (dish.diet === "vegetarian" || dish.diet === "jain") return 2;
      if (dish.diet === "vegan") return 1;
      return 0;
    }
    if (selectedSort === "vegan") {
      return dish.diet === "vegan" ? 2 : 0;
    }
    if (selectedSort === "jain") {
      const haystack = `${dish.whyItWorks ?? ""} ${dish.heroSummary ?? ""} ${dish.flavorProfile ?? ""}`.toLowerCase();
      const qualifies =
        dish.diet === "jain" ||
        jainKeywords.some((kw) => haystack.includes(kw)) ||
        dish.region.toLowerCase().includes("gujarat");
      return qualifies ? 2 : 0;
    }
    if (selectedSort.startsWith("tag-")) {
      const tag = selectedSort.replace("tag-", "");
      return (dish.categories || []).includes(tag) ? 2 : 0;
    }
    return 0;
  };

  const compareDishesBySort = (a?: DishDetailType, b?: DishDetailType) => {
    if (!a || !b) return 0;
    const priorityDiff = getSortPriority(b) - getSortPriority(a);
    if (priorityDiff !== 0) return priorityDiff;
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;
    const freshnessDiff = (dishMeta[b.slug]?.freshnessIndex ?? 0) - (dishMeta[a.slug]?.freshnessIndex ?? 0);
    if (freshnessDiff !== 0) return freshnessDiff;
    return a.name.localeCompare(b.name);
  };

  const matchesActiveFilters = (dish?: DishDetailType) => {
    if (!activeFilters.length) return true;
    if (!dish) return false;
    return activeFilters.every((filterId) => {
      const predicate = filterPredicates[filterId];
      return predicate ? predicate(dish) : true;
    });
  };

  const toggleSortMenu = () => {
    setSortMenuOpen((prev) => {
      const next = !prev;
      if (next) setFilterMenuOpen(false);
      return next;
    });
  };

  const toggleFilterMenu = () => {
    setFilterMenuOpen((prev) => {
      const next = !prev;
      if (next) setSortMenuOpen(false);
      return next;
    });
  };

  const handleSortSelect = (optionId: string | null) => {
    setSelectedSort((prev) => {
      if (optionId === null) return null;
      return prev === optionId ? null : optionId;
    });
    setSortMenuOpen(false);
  };

  const handleFilterToggle = (optionId: string) => {
    setActiveFilters((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]));
  };

  const clearFilters = () => setActiveFilters([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSortMenuOpen(false);
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [health, dishes] = await Promise.all([
          healthCheck(),
          getAllDishes({ category: "vegan" }),
        ]);

        if (!isMounted) return;

        setEngineHealth(health);
        setBackendDishNames(dishes.map((dish) => dish.name));

        const spotlightCandidate = dishes.find((dish) => dish.category === "vegan");
        if (spotlightCandidate) {
          try {
            const detail = await getDish(spotlightCandidate.name);
            if (isMounted) {
              setSpotlightDish(detail);
            }
          } catch (error) {
            console.error("Failed to fetch spotlight dish", error);
          }
        }
      } catch (error) {
        console.error("Plant search bootstrap failed", error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchPlantSearchResults = useCallback(
    async (term: string, filters: PlantSearchFilters, signal?: AbortSignal, requestId?: number) => {
      const normalized = term.trim();
      if (!normalized) {
        if (requestId === undefined || requestId === swapRequestIdRef.current) {
          setSwapEngineDishes([]);
          setSwapEngineError(null);
          setSwapEngineMeta(createEmptySwapMeta());
          setPlantRecommendations([]);
        }
        return;
      }

      if (requestId === undefined || requestId === swapRequestIdRef.current) {
        setSwapEngineLoading(true);
        setSwapEngineError(null);
        setSwapEngineMeta({
          ...createEmptySwapMeta(),
          appliedRestrictions: filters.dietaryRestrictions,
          texturePreference: filters.texturePreference,
          originalDish: normalized,
        });
      }

      try {
        const { dishes, raw } = await searchPlantAlternatives({
          dishName: normalized,
          limit: 9,
          signal,
        });

        if (requestId !== undefined && requestId !== swapRequestIdRef.current) {
          return;
        }

        setSwapEngineDishes(dishes ?? []);
        setPlantRecommendations(raw.slice(0, 3).map((result, index) => toPlantRecommendation(result, dishes[index])));
        const summary = summarizeRawResults(raw);
        setSwapEngineMeta({
          ...createEmptySwapMeta(),
          appliedRestrictions: filters.dietaryRestrictions,
          texturePreference:
            typeof filters.texturePreference === "number" ? filters.texturePreference : null,
          originalDish: normalized,
          engine: raw.length ? "plant-search" : undefined,
          ...summary,
        });
        setSwapEngineError(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (requestId !== undefined && requestId !== swapRequestIdRef.current) {
          return;
        }
        console.error("Plant search engine error", error);
        setSwapEngineDishes([]);
        setPlantRecommendations([]);
        if (error instanceof PlantSearchError && error.status === 404) {
          setSwapEngineError("No live plant-search matches were found. Try another dish name.");
        } else {
          setSwapEngineError("Live plant-search engine unavailable. Try again in a moment.");
        }
        setSwapEngineMeta(createEmptySwapMeta());
      } finally {
        if (requestId === undefined || requestId === swapRequestIdRef.current) {
          setSwapEngineLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const normalized = normalizedSearchTerm.trim();
    const requestTerm = normalized || searchTerm.trim();
    const isDietOnlyQuery = !normalized && !!dietIntent;

    if (!requestTerm || isDietOnlyQuery) {
      setSwapEngineDishes([]);
      setSwapEngineLoading(false);
      setSwapEngineError(null);
      setSwapEngineMeta(createEmptySwapMeta());
      setPlantRecommendations([]);
      return;
    }

    const controller = new AbortController();
    swapRequestIdRef.current += 1;
    const requestId = swapRequestIdRef.current;

    fetchPlantSearchResults(
      requestTerm,
      {
        dietaryRestrictions,
        texturePreference,
      },
      controller.signal,
      requestId
    );

    return () => {
      controller.abort();
    };
  }, [
    searchTerm,
    normalizedSearchTerm,
    dietaryRestrictions,
    texturePreference,
    dietIntent,
    fetchPlantSearchResults,
  ]);

  const swapResults = useMemo(() => {
    if (!swapEngineDishes.length) {
      return [];
    }

    const restrictionLabels = (swapEngineMeta.appliedRestrictions ?? []).map((value) => formatRestrictionLabel(value));
    const metaParts: string[] = [];
    const filteredRestrictions = restrictionLabels.filter(Boolean);
    if (filteredRestrictions.length) {
      metaParts.push(`Filters: ${filteredRestrictions.join(", ")}`);
    }
    if (typeof swapEngineMeta.texturePreference === "number") {
      metaParts.push(`Texture target ${Math.round(swapEngineMeta.texturePreference * 100)}%`);
    }
    if (swapEngineMeta.priceRanges && swapEngineMeta.priceRanges.length) {
      metaParts.push(`Price: ${swapEngineMeta.priceRanges.join(", ")}`);
    }
    if (swapEngineMeta.proteinTags && swapEngineMeta.proteinTags.length) {
      metaParts.push(`Protein: ${swapEngineMeta.proteinTags.join(", ")}`);
    }
    if (swapEngineMeta.availabilityTags && swapEngineMeta.availabilityTags.length) {
      metaParts.push(`Availability: ${swapEngineMeta.availabilityTags.join(", ")}`);
    }

    return [
      {
        id: "plant-search-live",
        title: swapEngineMeta.originalDish ? `Live swaps for ${swapEngineMeta.originalDish}` : "Plant search recommendations",
        keywords: swapEngineMeta.originalDish ? [swapEngineMeta.originalDish] : [],
        description: metaParts.length ? metaParts.join(" • ") : "Smart matches from the plant search engine.",
        dishes: swapEngineDishes,
      },
    ];
  }, [swapEngineDishes, swapEngineMeta]);
  const processedSwapResults = useMemo(() => {
    if (!swapResults.length) return [];

    const dietMode = getDietModeFromSort(selectedSort) ?? dietIntent;

    return swapResults
      .map((group) => {
        let dishes = [...group.dishes];
        if (dietMode) {
          dishes = dishes.filter((dish) => matchesDietMode(dish, dietMode));
        }
        if (selectedSort) {
          dishes = [...dishes].sort((a, b) => compareDishesBySort(a, b));
        }
        if (activeFilters.length) {
          dishes = dishes.filter((dish) => matchesActiveFilters(dish));
        }
        return { ...group, dishes };
      })
      .filter((group) => group.dishes.length > 0);
  }, [swapResults, selectedSort, activeFilters, filterPredicates, dishMeta, dietIntent]);

  const keywordAlternatives = useMemo(() => {
    const buildKey = (value: string) => value.trim().toLowerCase();
    const matchesCatalogDish = (dish: DishDetailType, keyword: string) => {
      const lower = keyword.toLowerCase();
      const categoryKeys = keywordToCategoryMap[lower] ?? [];
      const nameMatch = dish.name.toLowerCase().includes(lower);
      const replaceMatch = dish.replaces.some((item) => item.toLowerCase().includes(lower));
      const categoryMatch = dish.categories.some((category) => categoryKeys.includes(category));
      return nameMatch || replaceMatch || categoryMatch;
    };

    const matchesLocalDish = (dish: Dish, keyword: string) => dish.name.toLowerCase().includes(keyword.toLowerCase());

    return SEARCH_KEYWORDS.map((keyword) => {
      const catalogMatches = DISH_CATALOG.filter((dish) => matchesCatalogDish(dish, keyword));
      const localMatches = dishes.filter((dish) => matchesLocalDish(dish, keyword));
      const deduped = new Map<string, { id: string; name: string; detail?: DishDetailType }>();

      catalogMatches.forEach((dish) => {
        const key = buildKey(dish.slug || dish.name);
        if (!deduped.has(key)) {
          deduped.set(key, { id: dish.slug, name: dish.name, detail: dish });
        }
      });

      localMatches.forEach((dish) => {
        const key = buildKey(dish.id || dish.name);
        if (!deduped.has(key)) {
          deduped.set(key, { id: dish.id, name: dish.name });
        }
      });

      return {
        keyword,
        items: Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name)),
      };
    });
  }, []);

  // Search suggestions from keywords + mapped alternatives for autocomplete
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.trim().toLowerCase();
    const matchingDiet = DIET_SUGGESTIONS.filter((kw) => kw.includes(lower) || lower.includes(kw));
    const matchingNonVeg = SEARCH_KEYWORDS.filter((kw) => kw.includes(lower) || lower.includes(kw));
    const dishNames = dishes.map((d) => d.name).filter((name) => name.toLowerCase().includes(lower));
    const mappedAlternatives = keywordAlternatives
      .flatMap((group) => group.items.map((item) => item.name))
      .filter((name) => name.toLowerCase().includes(lower));
    const backendMatches = backendDishNames.filter((name) => name.toLowerCase().includes(lower));
    return [...new Set([...matchingDiet, ...matchingNonVeg, ...dishNames, ...mappedAlternatives, ...backendMatches])].slice(0, 10);
  }, [query, keywordAlternatives, backendDishNames]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [suggestions]);

  const rawHasSwapResults = swapResults.length > 0;
  const hasSwapResults = processedSwapResults.length > 0;
  const activeFilterCount = activeFilters.length;
  const currentSortLabel = selectedSort
    ? sortOptions.find((option) => option.id === selectedSort)?.label ?? "Custom"
    : "Sort";
  const sortButtonLabel = selectedSort ? `Sort: ${currentSortLabel}` : "Sort";
  const filterButtonLabel = activeFilterCount ? `Filter (${activeFilterCount})` : "Filter";
  const noResultsWithFilters = searchTerm && rawHasSwapResults && !hasSwapResults;

  // Handle search submission
  const handleSearch = (term: string) => {
    const { cleaned, mode } = stripDietTokens(term);
    setSearchTerm(term);
    setNormalizedSearchTerm(cleaned);
    setDietIntent(mode);
    if (mode) {
      setSelectedSort((prev) => (prev === mode ? prev : mode));
    }
  };

  const handleSuggestionSelect = (value: string) => {
    setQuery(value);
    handleSearch(value);
    setActiveSuggestionIndex(-1);
  };

  const handleSearchInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      return;
    }
    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      handleSuggestionSelect(suggestions[activeSuggestionIndex]);
    }
    if (event.key === "Escape") {
      setActiveSuggestionIndex(-1);
    }
  };

  // Handle dish selection
  const handleSelectDish = (dish: DishDetailType) => {
    // Show immediate detail using the current object
    setSelectedDish(dish);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // For live plant-search dishes, hydrate with full dataset details
    if (dish.matchMeta?.source === "plant-search") {
      getDish(dish.name)
        .then((full) => {
          const hydrated = mapPlantDishResponseToDishDetail(full, dish.matchMeta?.originalDish ?? query.trim());
          hydrated.matchMeta = {
            ...hydrated.matchMeta,
            ...dish.matchMeta,
          };
          setSelectedDish(hydrated);
        })
        .catch((error) => {
          console.error("Failed to hydrate dish details from plant-search", error);
        });
    }
  };

  // Handle back from dish detail
  const handleBackFromDetail = () => {
    setSelectedDish(null);
  };

  useEffect(() => {
    if (!selectedDish) {
      setCostSaved(null);
      setCostSavedStatus("idle");
      return;
    }

    const originalDishName = selectedDish.matchMeta?.originalDish || selectedDish.replaces?.[0];
    const originalCost = normalizeCostValue(selectedDish.priceOriginal);
    const veganCost = normalizeCostValue(selectedDish.priceSwap ?? selectedDish.estimatedCost);

    if (!originalDishName || !originalCost || !veganCost) {
      setCostSaved(null);
      setCostSavedStatus("unavailable");
      return;
    }

    const controller = new AbortController();
    setCostSaved(null);
    setCostSavedStatus("loading");

    (async () => {
      try {
        const response = await fetch("/api/cost-savings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalDishName,
            originalCost,
            veganDishName: selectedDish.name,
            veganCost,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Cost savings request failed: ${response.status}`);
        }

        const payload = await response.json();
        const rawValue =
          typeof payload.savings === "number"
            ? payload.savings
            : Number.parseInt(String(payload.savings ?? "").replace(/[^0-9-]/g, ""), 10);

        if (!Number.isFinite(rawValue)) {
          setCostSaved(null);
          setCostSavedStatus("unavailable");
          return;
        }

        setCostSaved(rawValue);
        setCostSavedStatus("idle");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Failed to calculate cost savings", error);
        setCostSaved(null);
        setCostSavedStatus("error");
      }
    })();

    return () => {
      controller.abort();
    };
  }, [selectedDish]);

  const topPicksWithDetail = useMemo(
    () =>
      dishes.map((dish) => ({
        dish,
        detail: DISH_CATALOG.find((entry) => entry.slug === dish.id || entry.name === dish.name),
      })),
    []
  );

  const filteredTopPicks = useMemo(() => {
    const term = query.trim().toLowerCase();
    let picks = topPicksWithDetail;
    if (term) {
      picks = picks.filter(({ dish }) => dish.name.toLowerCase().includes(term));
    }
    const dietMode = getDietModeFromSort(selectedSort) ?? dietIntent;
    if (dietMode) {
      picks = picks.filter(({ detail }) => (detail ? matchesDietMode(detail, dietMode) : false));
    }
    if (activeFilters.length) {
      picks = picks.filter(({ detail }) => matchesActiveFilters(detail));
    }
    if (selectedSort) {
      picks = [...picks].sort((a, b) => compareDishesBySort(a.detail, b.detail));
    }
    return picks.map(({ dish }) => dish).slice(0, 8);
  }, [query, topPicksWithDetail, activeFilters, selectedSort, dietIntent]);

  const toggleRestriction = (value: string) => {
    setDietaryRestrictions((prev) =>
      prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]
    );
  };

  const toggleCuisine = (name: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const toggleAllergy = (name: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const toggleTaste = (name: string) => {
    setSelectedTastes((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const budgetCopy = useMemo(() => {
    if (budgetLevel === 1) return { label: "Budget", desc: "Keep swaps ultra-affordable" };
    if (budgetLevel === 2) return { label: "Standard", desc: "Balance cost and quality" };
    return { label: "Premium", desc: "Add specialty ingredients" };
  }, [budgetLevel]);

  const savePrefs = () => {
    setPrefSaved("Preferences saved for this demo session.");
    setTimeout(() => setPrefSaved(""), 3200);
  };

  // If a dish is selected, show the detail view
  if (selectedDish) {
    return (
      <main className={`${jakarta.className} ${impact.variable} min-h-screen w-full bg-black text-white`}>
        <DishDetail
          dish={selectedDish}
          onBack={handleBackFromDetail}
          costSaved={costSaved}
          costSavedStatus={costSavedStatus}
        />
      </main>
    );
  }

  return (
    <main className={`${jakarta.className} ${impact.variable} min-h-screen bg-highlight text-slate-900`}>
      <nav className="sticky top-0 z-50 border-b-3 border-black bg-highlight/90 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="group flex items-center gap-1">
            <img
              src="/logo.png"
              alt="OffRamp logo"
              className="w-40 rounded-full object-contain transition-transform duration-300 group-hover:rotate-6 "
            />
          </div>
          <div className="hidden items-center gap-8 text-sm font-bold uppercase tracking-wider md:flex">
            <div className="relative group">
              <Link
                href="/#home"
                className="relative flex items-center gap-1 transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
              >
                Home
                <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:rotate-180">
                  expand_more
                </span>
              </Link>
              <div className="absolute left-0 top-full z-20 mt-3 hidden min-w-[360px] rounded-2xl border-2 border-black bg-white px-2 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:block">
                <div className="absolute -top-3 left-0 right-0 h-3" />
                <div className="grid grid-cols-4 gap-2 divide-x divide-black/10">
                  <Link
                    href="/#how-it-works"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">home</span>
                    <span>How it Works</span>
                  </Link>
                  <Link
                    href="/#features"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">auto_graph</span>
                    <span>Features</span>
                  </Link>
                  <Link
                    href="/#impact"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">insights</span>
                    <span>Impact</span>
                  </Link>
                  <Link
                    href="/#institutions"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">apartment</span>
                    <span>Institutions</span>
                  </Link>
                </div>
              </div>
            </div>
            <Link href="/swap" className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              Food Swap
            </Link>
            <Link href="/compass" className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full" prefetch={false}>
              Compass
            </Link>
            <Link href="/coming-soon" className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              Coming Soon
            </Link>
            <Link href="/#about" className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              About
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isDemo ? (
              <div className="hidden items-center gap-2 rounded-full border-2 border-black bg-white px-6 py-2 text-sm font-black uppercase text-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:flex">
                <span className="material-symbols-outlined text-base text-primary">verified</span>
                Demo
              </div>
            ) : (
              <NavAuthButton className="hidden transform items-center gap-2 rounded-full border-2 border-black px-8 py-2 text-sm font-bold uppercase transition-all duration-300 hover:scale-105 hover:bg-black hover:text-white sm:flex" />
            )}
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pt-16 pb-12">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <p className="font-impact text-5xl uppercase leading-[0.95] text-black md:text-6xl">Start Your Swap</p>
            <p className="max-w-xl text-lg font-semibold text-slate-700">
              Search any dish and see our best plant-powered swaps without leaving this page. No login required.
            </p>
          </div>

          {/* <div className="relative flex justify-center">
            <div className="relative w-full max-w-[420px] rotate-2 rounded-[3rem] border-4 border-black bg-black p-4 shadow-2xl transition-transform duration-500 hover:scale-105 hover:rotate-0">
              <div className="relative aspect-[9/19] overflow-hidden rounded-[2.5rem] bg-white">
                <div className="flex h-full flex-col p-6">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="font-impact text-xl">OFFRAMP</span>
                    <span className="material-symbols-outlined">menu</span>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="group relative h-48 overflow-hidden rounded-2xl border-3 border-black">
                      <Image
                        src="/assets/Soya%20Keema.jpeg"
                        alt="Before swap"
                        fill
                        sizes="320px"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        priority
                      />
                      <div className="absolute left-2 top-2 rounded bg-black px-3 py-1 text-[10px] font-bold text-white">BEFORE</div>
                    </div>
                    <div className="flex justify-center">
                      <div className="animate-bounce-slow rounded-full border-2 border-black bg-accent p-2 text-white">
                        <span className="material-symbols-outlined font-bold">keyboard_double_arrow_down</span>
                      </div>
                    </div>
                    <div className="group relative h-48 overflow-hidden rounded-2xl border-3 border-black">
                      <Image
                        src="/assets/mushroom-kathi-roll.svg"
                        alt="After swap"
                        fill
                        sizes="320px"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute left-2 top-2 rounded bg-primary px-3 py-1 text-[10px] font-bold text-white">AFTER</div>
                    </div>
                    <div className="rounded-xl border-2 border-black bg-highlight p-4 text-sm font-bold italic">
                      "Jackfruit Keema: 95% texture match"
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 top-1/2 left-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-grid opacity-50 grid-pattern animate-pulse-slow" />
          </div> */}
        </div>
      </section>

      <section id="search" className="px-6 pb-6">
        <div className="mx-auto max-w-6xl">
          <div className="relative mb-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}
              className="flex flex-wrap items-center gap-3 rounded-2xl border-3 border-black bg-white px-5 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex min-w-[220px] flex-1 items-center gap-3">
                <span className="material-symbols-outlined text-xl text-slate-500">search</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchInputKeyDown}
                  placeholder="Search your favorite dish (e.g., Chicken Biryani, Mutton Curry)"
                  className="flex-1 bg-transparent text-base font-semibold text-black placeholder:text-slate-400 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSearchTerm("");
                      setNormalizedSearchTerm("");
                      setDietIntent(null);
                    }}
                    className="text-slate-500 transition hover:text-black"
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <div className="relative" ref={sortMenuRef}>
                  <button
                    type="button"
                    onClick={toggleSortMenu}
                    aria-haspopup="menu"
                    aria-expanded={sortMenuOpen}
                    className={`flex items-center gap-2 rounded-full border-2 border-black px-4 py-2 text-sm font-bold uppercase transition transform ${
                      selectedSort ? "bg-black text-white" : "bg-white text-black"
                    } hover:-translate-y-[1px] hover:bg-black hover:text-white`}
                  >
                    {sortButtonLabel}
                    <span
                      className={`material-symbols-outlined text-base transition ${sortMenuOpen ? "rotate-180" : ""}`}
                    >
                      expand_more
                    </span>
                  </button>
                  {sortMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border-3 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={!selectedSort}
                        onClick={() => handleSortSelect(null)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition hover:bg-highlight ${
                          !selectedSort ? "text-primary" : "text-slate-700"
                        }`}
                      >
                        Default order
                        {!selectedSort && <span className="material-symbols-outlined text-base">check</span>}
                      </button>
                      {sortOptions.map((option) => {
                        const isActive = selectedSort === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="menuitemradio"
                            aria-checked={isActive}
                            onClick={() => handleSortSelect(option.id)}
                            className={`flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition hover:bg-highlight ${
                              isActive ? "text-primary" : "text-slate-700"
                            }`}
                          >
                            <span>
                              {option.label}
                              {option.description && (
                                <span className="block text-[11px] font-normal uppercase tracking-wide text-slate-400">
                                  {option.description}
                                </span>
                              )}
                            </span>
                            {isActive && <span className="material-symbols-outlined text-base">check</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="relative" ref={filterMenuRef}>
                  <button
                    type="button"
                    onClick={toggleFilterMenu}
                    aria-haspopup="menu"
                    aria-expanded={filterMenuOpen}
                    className={`flex items-center gap-2 rounded-full border-2 border-black px-4 py-2 text-sm font-bold uppercase transition transform ${
                      activeFilterCount ? "bg-primary text-white" : "bg-white text-black"
                    } hover:-translate-y-[1px] hover:bg-primary hover:text-white`}
                  >
                    {filterButtonLabel}
                    <span
                      className={`material-symbols-outlined text-base transition ${filterMenuOpen ? "rotate-180" : ""}`}
                    >
                      expand_more
                    </span>
                  </button>
                  {filterMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border-3 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {filterOptions.map((option) => {
                        const isActive = activeFilters.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={isActive}
                            onClick={() => handleFilterToggle(option.id)}
                            className={`flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition hover:bg-highlight ${
                              isActive ? "text-primary" : "text-slate-700"
                            }`}
                          >
                            <span>
                              {option.label}
                              {option.description && (
                                <span className="block text-[11px] font-normal uppercase tracking-wide text-slate-400">
                                  {option.description}
                                </span>
                              )}
                            </span>
                            {isActive && <span className="material-symbols-outlined text-base">check</span>}
                          </button>
                        );
                      })}
                      {activeFilters.length > 0 && (
                        <button
                          type="button"
                          className="flex w-full items-center justify-center border-t border-black/10 px-4 py-2 text-xs font-bold uppercase text-slate-500 transition hover:text-black"
                          onClick={() => {
                            clearFilters();
                            setFilterMenuOpen(false);
                          }}
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="rounded-xl border-2 border-black bg-black px-4 py-2 text-sm font-bold uppercase text-white transition hover:bg-accent"
                >
                  Find Swaps
                </button>
              </div>
              <div className="mt-4 w-full rounded-2xl border border-dashed border-black/10 bg-highlight/40 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Plant search filters
                  {swapEngineLoading && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[10px] font-semibold text-primary">
                      <span className="material-symbols-outlined text-base">motion_photos_auto</span>
                      syncing
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {PLANT_SEARCH_RESTRICTIONS.map((option) => {
                    const isActive = dietaryRestrictions.includes(option.id);
                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() => toggleRestriction(option.id)}
                        className={`inline-flex items-center gap-1 rounded-full border-2 border-black px-3 py-1 text-xs font-black uppercase transition ${
                          isActive ? "bg-primary text-white" : "bg-white text-black hover:bg-highlight"
                        }`}
                      >
                        {option.label}
                        {isActive && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    );
                  })}
                  {!dietaryRestrictions.length && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">None selected</span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Texture match
                  </div>
                  <div className="flex flex-1 items-center gap-3">
                    <input
                      type="range"
                      min={60}
                      max={100}
                      step={5}
                      value={Math.round((texturePreference ?? DEFAULT_TEXTURE_TARGET) * 100)}
                      onChange={(event) => setTexturePreference(Number(event.target.value) / 100)}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-black text-black">
                      {texturePreference === null ? "Auto" : `${Math.round((texturePreference ?? 0) * 100)}%`}
                    </span>
                    {texturePreference !== null && (
                      <button
                        type="button"
                        onClick={() => setTexturePreference(null)}
                        className="text-xs font-bold uppercase text-primary transition hover:text-black"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
            {suggestions.length > 0 && !searchTerm && (
              <div className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border-3 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <ul className="divide-y divide-black/10">
                  {suggestions.map((sugg, index) => {
                    const isActive = index === activeSuggestionIndex;
                    return (
                      <li key={sugg}>
                      <button
                        type="button"
                        onClick={() => {
                          handleSuggestionSelect(sugg);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-highlight ${
                          isActive ? "bg-highlight" : ""
                        }`}
                      >
                        {sugg}
                        <span className="material-symbols-outlined text-base text-slate-500">north_east</span>
                      </button>
                    </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {engineHealth && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border-2 border-black bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Engine status</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                      <span className="material-symbols-outlined text-base">monitor_heart</span>
                      {engineHealth.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-black text-black">{engineHealth.dish_count} dishes indexed</p>
                  <p className="text-xs text-slate-500">Live from the Plant-Based Transition Engine</p>
                </div>
                {spotlightDish && (
                  <div className="rounded-2xl border-2 border-dashed border-black/30 bg-highlight/60 px-4 py-3 text-sm font-semibold text-slate-700">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Spotlight</p>
                    <p className="text-lg font-impact uppercase text-black">{spotlightDish.name}</p>
                    <p className="text-xs text-slate-500">Protein: {spotlightDish.nutrition.protein} · Price: {spotlightDish.price_range}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Flavor focus: {(spotlightDish.taste_features?.flavor_base?.primary?.slice(0, 2) ?? []).join(", ") || "Chef curated"}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {swapEngineLoading && <span className="text-primary">Plant-search engine ranking live picks…</span>}
              {!swapEngineLoading && swapEngineError && (
                <span className="text-red-600">{swapEngineError}</span>
              )}
              {!swapEngineLoading && !swapEngineError && swapEngineDishes.length > 0 && (
                <span className="text-primary">
                  Plant-search engine ready — {swapEngineDishes.length} smart match{swapEngineDishes.length === 1 ? "" : "es"} ranked.
                </span>
              )}
              {!swapEngineLoading && !swapEngineError && !swapEngineDishes.length && (
                <span>Plant-search engine will activate after your next search.</span>
              )}
            </div>
          </div>
        </div>
        {activeFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            {activeFilters.map((filterId) => {
              const option = filterOptions.find((opt) => opt.id === filterId);
              if (!option) return null;
              return (
                <button
                  type="button"
                  key={filterId}
                  className="inline-flex items-center gap-1 rounded-full border border-black/20 bg-primary/10 px-3 py-1 text-primary transition hover:bg-primary hover:text-white"
                  onClick={() => handleFilterToggle(filterId)}
                >
                  {option.label}
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              );
            })}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-slate-500 transition hover:text-black"
              onClick={clearFilters}
            >
              Reset all
            </button>
          </div>
        )}
      </section>

      {/* Swap Results Section */}
      {hasSwapResults && (
        <section id="swap-results" className="px-6 pb-12">
          <div className="mx-auto max-w-6xl space-y-6">
            {processedSwapResults.map((group) => (
              <div key={group.id} className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-white">
                        Alternative for "{searchTerm}"
                      </span>
                    </div>
                    <p className="font-impact text-4xl uppercase text-black">{group.title}</p>
                    <p className="text-sm font-semibold text-slate-600">{group.description}</p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    {group.dishes.length} swap{group.dishes.length !== 1 ? "s" : ""} found
                  </span>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {group.dishes.map((dish) => (
                    <SwapResultCard key={dish.slug} dish={dish} onSelect={() => handleSelectDish(dish)} />
                  ))}
                </div>
              </div>
            ))}

            {/* Ethical Micro-Feedback */}
            <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-6 py-4 text-center">
              <p className="text-sm font-medium text-primary">
                🌱 Small swaps like these reduce environmental impact without changing what you love to eat.
              </p>
            </div>
          </div>
        </section>
      )}

      {noResultsWithFilters && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-2xl rounded-2xl border-3 border-black bg-white px-6 py-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-impact text-2xl uppercase text-black">No matches with current filters</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Try removing one of the filters or resetting to the default ordering to see every available swap for "{searchTerm}".
            </p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setActiveFilters([]);
                  setSelectedSort(null);
                }}
                className="rounded-full border-2 border-black bg-black px-5 py-2 text-xs font-bold uppercase text-white transition hover:bg-accent"
              >
                Reset filters & sort
              </button>
            </div>
          </div>
        </section>
      )}

      {/* No Results Message */}
      {searchTerm && !rawHasSwapResults && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-2xl rounded-2xl border-3 border-black bg-white px-6 py-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-impact text-2xl uppercase text-black">No swaps found for "{searchTerm}"</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Try searching for dishes like Chicken Biryani, Mutton Curry, Fish Fry, or Egg Bhurji to see plant-based alternatives.
            </p>
          </div>
        </section>
      )}

      <section id="recommended" className="px-6 pb-12">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-impact text-4xl uppercase text-black">Plant Engine Picks</p>
              <p className="text-sm font-semibold text-slate-600">Live matches showing protein, price, and match score straight from the backend.</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              {plantRecommendations.length ? "Updated from your last search" : "Run a search to populate"}
            </span>
          </div>
          {plantRecommendations.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plantRecommendations.map((recommendation) => (
                <PlantRecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onSelect={() => {
                    if (recommendation.detail) {
                      handleSelectDish(recommendation.detail);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-3 border-dashed border-black/20 bg-white px-6 py-8 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]">
              <p className="font-impact text-2xl uppercase text-black">Search to unlock recommendations</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Use the search box above to get fresh plant-based matches with real-time scores from the transition engine.
              </p>
            </div>
          )}
        </div>
      </section>

      {isDemoTable && (
        <section id="preferences" className="px-6 pb-12">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="overflow-hidden rounded-3xl border-3 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="grid grid-cols-4 bg-highlight px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                <span>Step</span>
                <span>Label</span>
                <span>Status</span>
                <span>Notes</span>
              </div>
              <div className="divide-y divide-black/10 text-sm font-semibold text-slate-800">
                <div className="grid grid-cols-4 items-center px-4 py-3">
                  <span className="font-impact text-xl text-accent">1</span>
                  <span className="font-bold text-black">Cuisines</span>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-black uppercase text-white">Completed</span>
                  <span className="text-slate-600">Region + preferred cuisines</span>
                </div>
                <div className="grid grid-cols-4 items-center px-4 py-3">
                  <span className="font-impact text-xl text-slate-500">2</span>
                  <span className="font-bold text-black">Constraints</span>
                  <span className="rounded-full bg-highlight px-3 py-1 text-xs font-black uppercase text-primary">In Progress</span>
                  <span className="text-slate-600">Allergies, exclusions</span>
                </div>
                <div className="grid grid-cols-4 items-center px-4 py-3">
                  <span className="font-impact text-xl text-slate-500">3</span>
                  <span className="font-bold text-black">Budget</span>
                  <span className="rounded-full bg-highlight px-3 py-1 text-xs font-black uppercase text-primary">In Progress</span>
                  <span className="text-slate-600">Rank by affordability</span>
                </div>
                <div className="grid grid-cols-4 items-center px-4 py-3">
                  <span className="font-impact text-xl text-slate-500">4</span>
                  <span className="font-bold text-black">Review</span>
                  <span className="rounded-full bg-highlight px-3 py-1 text-xs font-black uppercase text-primary">Pending</span>
                  <span className="text-slate-600">Confirm & save</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-impact text-4xl uppercase text-black">Preferences Checklist</p>
                <p className="text-sm font-semibold text-slate-600">Curated from your profile setup. Edit anytime.</p>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Live profile</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="overflow-hidden rounded-3xl border-3 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="grid grid-cols-2 bg-highlight px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-700 sm:grid-cols-4">
                  <span>Preference</span>
                  <span>Selection</span>
                  <span className="hidden sm:block">Notes</span>
                  <span className="hidden sm:block">Status</span>
                </div>
                <div className="divide-y divide-black/10 text-sm font-semibold text-slate-800">
                  <ChecklistRow label="Region" value="South India" note="Spice-forward" status="Active" />
                  <ChecklistRow label="Cuisines" value="Tamil, Telugu, Kerala" note="Favor coastal" status="Active" />
                  <ChecklistRow label="Diet" value="Veg" note="High protein swaps" status="Locked" />
                  <ChecklistRow label="Allergies" value="None" note="All clear" status="Active" />
                  <ChecklistRow label="Budget" value="Standard" note="Balance cost/quality" status="Active" />
                  <ChecklistRow label="Taste" value="Spicy, Savory" note="Keep heat" status="Active" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border-3 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-accent text-white">
                      <span className="material-symbols-outlined text-base">restaurant</span>
                    </div>
                    <p className="font-impact text-2xl uppercase">Top cuisines</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-black uppercase">
                    <span className="rounded-full border-2 border-black bg-highlight px-3 py-1">Tamil</span>
                    <span className="rounded-full border-2 border-black bg-highlight px-3 py-1">Telugu</span>
                    <span className="rounded-full border-2 border-black bg-highlight px-3 py-1">Kerala</span>
                    <span className="rounded-full border-2 border-black bg-highlight px-3 py-1">Hyderabadi</span>
                  </div>
                </div>

                <div className="rounded-3xl border-3 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-primary text-white">
                      <span className="material-symbols-outlined text-base">payments</span>
                    </div>
                    <p className="font-impact text-2xl uppercase">Budget focus</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Standard • Balanced between cost and quality</p>
                  <div className="mt-4 h-3 w-full rounded-full border-2 border-black bg-highlight">
                    <div className="h-full w-2/3 rounded-full bg-accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {isDemoForm && (
        <section id="preferences" className="px-6 pb-12">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-impact text-4xl uppercase text-black">Set Your Preferences</p>
                <p className="text-sm font-semibold text-slate-600">Adjust and save without leaving this page.</p>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Demo profile active</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border-3 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-accent text-white">
                      <span className="material-symbols-outlined text-base">public</span>
                    </div>
                    <p className="font-impact text-2xl uppercase">Cuisines</p>
                  </div>
                  <label className="text-sm font-bold text-black">
                    Region
                    <div className="relative mt-2">
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full rounded-2xl border-3 border-black bg-white px-4 py-3 text-sm font-semibold text-black focus:outline-none"
                      >
                        <option value="">Select a region...</option>
                        <option value="South India">South India</option>
                        <option value="North India">North India</option>
                        <option value="Coastal">Coastal</option>
                        <option value="Hyderabadi">Hyderabadi</option>
                        <option value="Global">Global</option>
                      </select>
                    </div>
                  </label>

                  <div className="mt-4">
                    <p className="text-sm font-bold text-black">Preferred cuisines</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cuisineOptions.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCuisine(c)}
                          className={`rounded-full border-2 border-black px-3 py-1 text-xs font-black uppercase transition ${
                            selectedCuisines.includes(c) ? "bg-accent text-white" : "bg-highlight text-black hover:bg-white"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border-3 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-primary text-white">
                      <span className="material-symbols-outlined text-base">emergency</span>
                    </div>
                    <p className="font-impact text-2xl uppercase">Constraints</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {allergyOptions.map((a) => (
                      <label
                        key={a}
                        className={`flex items-center gap-2 rounded-2xl border-2 border-black px-3 py-2 text-sm font-semibold transition ${
                          selectedAllergies.includes(a) ? "bg-accent text-white" : "bg-white hover:bg-highlight"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAllergies.includes(a)}
                          onChange={() => toggleAllergy(a)}
                          className="h-4 w-4 rounded border-2 border-black text-primary"
                        />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border-3 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-primary text-white">
                      <span className="material-symbols-outlined text-base">payments</span>
                    </div>
                    <p className="font-impact text-2xl uppercase">Budget</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{budgetCopy.label} • {budgetCopy.desc}</p>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    value={budgetLevel}
                    onChange={(e) => setBudgetLevel(Number(e.target.value))}
                    className="mt-4 w-full accent-accent"
                  />
                  <div className="mt-2 flex justify-between text-xs font-bold uppercase text-slate-500">
                    <span>Budget</span>
                    <span>Standard</span>
                    <span>Premium</span>
                  </div>
                </div>

                <div className="rounded-3xl border-3 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-accent text-white">
                      <span className="material-symbols-outlined text-base">restaurant_menu</span>
                    </div>
                    <p className="font-impact text-2xl uppercase">Taste</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tasteOptions.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTaste(t)}
                        className={`rounded-full border-2 border-black px-3 py-1 text-xs font-black uppercase transition ${
                          selectedTastes.includes(t) ? "bg-primary text-white" : "bg-highlight text-black hover:bg-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={savePrefs}
                    className="w-full rounded-2xl border-3 border-black bg-black px-4 py-3 text-sm font-black uppercase text-white transition hover:-translate-y-1 hover:bg-accent hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Save preferences
                  </button>
                </div>
                {prefSaved && (
                  <div className="rounded-2xl border-2 border-emerald-700 bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {prefSaved}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border-3 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-highlight text-black">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                </div>
                <p className="font-impact text-2xl uppercase">Current summary</p>
              </div>
              <div className="grid gap-2 text-sm font-semibold text-slate-800 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Region</p>
                  <p className="text-black">{region || "Not selected"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Cuisines</p>
                  <p className="text-black">{selectedCuisines.length ? selectedCuisines.join(", ") : "None selected"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Allergies</p>
                  <p className="text-black">{selectedAllergies.length ? selectedAllergies.join(", ") : "None"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Budget</p>
                  <p className="text-black">{budgetCopy.label}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Tastes</p>
                  <p className="text-black">{selectedTastes.length ? selectedTastes.join(", ") : "None"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {isDemo && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-impact text-4xl uppercase text-black">Your Preferences</p>
                <p className="text-sm font-semibold text-slate-600">Quick checklist from your demo profile.</p>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Demo profile active</span>
            </div>
            <div className="overflow-hidden rounded-3xl border-3 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="grid grid-cols-2 bg-highlight px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-700 sm:grid-cols-4">
                <span>Preference</span>
                <span>Selection</span>
                <span className="hidden sm:block">Notes</span>
                <span className="hidden sm:block">Status</span>
              </div>
              <div className="divide-y divide-black/10 text-sm font-semibold text-slate-800">
                <ChecklistRow label="Diet" value="Veg" note="High protein swaps" status="Locked in" />
                <ChecklistRow label="Budget" value="Medium" note="Value-friendly" status="Active" />
                <ChecklistRow label="Taste" value="Spicy, Savory" note="Bold flavors" status="Active" />
                <ChecklistRow label="Location" value="India" note="Local pricing" status="Active" />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl animate-slide-up">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-impact text-3xl uppercase text-black">Top Picks Right Now</p>
            <span className="text-sm font-bold text-slate-500">Tailored to your search</span>
          </div>
          <div className="relative -mx-2 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollBehavior: "smooth" }}>
            <div className="flex gap-4 px-2">
              {filteredTopPicks.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t-3 border-black bg-white px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 md:flex-row">
          <div className="group flex items-center gap-1">
            <img
              src="/image.png"
              alt="OffRamp logo"
              className="h-[120px] w-[120px] rounded-full object-contain transition-transform duration-300 group-hover:rotate-6"
            />
            <span className="font-impact text-4xl uppercase">OffRamp</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-black uppercase tracking-widest">
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              Privacy
            </a>
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              Terms
            </a>
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              LinkedIn
            </a>
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              Contact
            </a>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            © 2026 OFFRAMP. BE BOLD. EAT WELL.
          </div>
        </div>
      </footer>

      {showCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-md rounded-3xl border-3 border-black bg-white p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <button
              type="button"
              aria-label="Close QR"
              onClick={() => setShowCode(false)}
              className="absolute right-3 top-3 rounded-full border-2 border-black bg-white px-2 py-1 text-xs font-black text-black transition hover:bg-black hover:text-white"
            >
              ✕
            </button>
            <div className="flex flex-col items-center gap-3">
              <p className="font-impact text-2xl uppercase text-black">Scan to Explore</p>
              <div className="overflow-hidden rounded-2xl border-2 border-black bg-white">
                <Image src="/code.png" alt="OffRamp QR" width={400} height={400} />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DishCard({ dish }: { dish: Dish }) {
  const detail = useMemo(
    () => DISH_CATALOG.find((entry) => entry.slug === dish.id || entry.name === dish.name),
    [dish]
  );
  const viewedByLabel = formatViewsLabel(dish.reviewCount);
  const totalTimeLabel = formatMinutesLabel(detail?.totalTime ?? detail?.cookTime ?? detail?.prepTime);
  const caloriesLabel = formatCaloriesLabel(detail?.calories);
  const itemsLabel = formatItemsLabel(detail?.ingredients?.length);
  const nutritionMatchLabel = formatMatchScoreLabel(detail?.matchMeta?.score);
  const statPills = [
    totalTimeLabel && { icon: "schedule", label: totalTimeLabel },
    caloriesLabel && { icon: "local_fire_department", label: caloriesLabel },
    nutritionMatchLabel && { icon: "verified", label: nutritionMatchLabel },
    viewedByLabel && { icon: "visibility", label: viewedByLabel },
  ].filter(Boolean) as Array<{ icon: string; label: string }>;
  const ratingLabel = typeof dish.rating === "number" ? `${dish.rating.toFixed(1)} rating` : null;
  const detailLines = [`${dish.restaurant}`, `${dish.category} spices`];

  return (
    <div className="group relative w-72 shrink-0 snap-start overflow-hidden rounded-3xl border-3 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.45)] transition duration-300 hover:-translate-y-2 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.55)]">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={dish.image || "/assets/placeholder.svg"}
          alt={dish.name}
          fill
          sizes="320px"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-4 py-3 text-white">
          <p className="font-impact text-2xl tracking-wide">{dish.name}</p>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-white/80">
            <span>{dish.restaurant}</span>
            <span>{dish.category}</span>
          </div>
          {statPills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-white/90">
              {statPills.map((stat) => (
                <span
                  key={`${dish.id}-${stat.icon}`}
                  className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur"
                >
                  <span className="material-symbols-outlined text-sm">{stat.icon}</span>
                  {stat.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 border-t-2 border-black/10 bg-white p-4 text-left text-slate-800">
        <div className="flex items-center justify-between">
          <p className="font-impact text-xl uppercase text-black">Ingredients & details</p>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Coming Soon</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Chef says</p>
        <ul className="list-disc space-y-1 pl-5 text-sm font-semibold text-slate-600">
          {detailLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
          {ratingLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <span className="material-symbols-outlined text-base text-primary">star</span>
              {ratingLabel}
            </span>
          )}
          {itemsLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <span className="material-symbols-outlined text-base text-primary">inventory_2</span>
              {itemsLabel}
            </span>
          )}
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
          Fresh prep notes are being polished—stay tuned for chef-mode insights.
        </div>
      </div>
    </div>
  );
}

const getMatchQualityLabel = (score: number) => {
  if (score >= 0.95) return "Elite match";
  if (score >= 0.9) return "High confidence";
  return "Good starter match";
};

function PlantRecommendationCard({ recommendation, onSelect }: { recommendation: PlantRecommendation; onSelect?: () => void }) {
  const scoreLabel = `${Math.round(recommendation.score * 100)}% match`;
  const matchQuality = getMatchQualityLabel(recommendation.score);
  const reasons = recommendation.reasons.slice(0, 3);
  const proteinLabel = recommendation.protein ? `${recommendation.protein} protein` : "Protein detail coming soon";
  const priceLabel = recommendation.priceRange ? recommendation.priceRange : "Price range TBD";

  return (
    <button
      type="button"
      onClick={recommendation.detail ? onSelect : undefined}
      className="flex h-full flex-col gap-4 rounded-3xl border-3 border-black bg-white px-5 py-5 text-left shadow-[5px_5px_0px_0px_rgba(0,0,0,0.4)] transition duration-300 hover:-translate-y-1 hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-impact text-2xl uppercase text-black">{recommendation.name}</p>
          <p className="text-sm font-semibold text-slate-500">{recommendation.availability}</p>
        </div>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-black uppercase text-white">{matchQuality}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] text-slate-400">Score</p>
          <p className="text-base font-black text-black">{scoreLabel}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] text-slate-400">Protein</p>
          <p className="text-base font-black text-black">{proteinLabel}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] text-slate-400">Price</p>
          <p className="text-base font-black text-black">{priceLabel}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] text-slate-400">Availability</p>
          <p className="text-base font-black text-black">{recommendation.availability || "—"}</p>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Match reasons</p>
        {reasons.length ? (
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-700">
            {reasons.map((reason) => (
              <span key={`${recommendation.id}-${reason}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                <span className="material-symbols-outlined text-sm text-primary">bolt</span>
                {reason}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Detailed reasoning coming soon.</p>
        )}
      </div>
      {recommendation.detail ? (
        <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
          Tap to open full dish detail
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          This recommendation will open in-place once additional detail is synced.
        </div>
      )}
    </button>
  );
}

// Swap result card for search results
function SwapResultCard({ dish, onSelect }: { dish: DishDetailType; onSelect: () => void }) {
  const viewedBy = typeof dish.reviews === "number" ? dish.reviews.toLocaleString() : null;
  const ingredients = dish.ingredients?.slice(0, 5) || [];
  const chefTips = dish.chefTips?.slice(0, 2) || [];
  const slug = dish.slug ?? dish.name ?? "swap-dish";
  const engineMeta = dish.matchMeta;
  const nutritionMatchLabel = formatMatchScoreLabel(engineMeta?.score);
  const ratingValue = typeof dish.rating === "number" ? dish.rating.toFixed(1) : null;
  const liveScoreLabel = typeof engineMeta?.score === "number" ? `${Math.round(engineMeta.score * 100)}% live score` : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      suppressHydrationWarning
      className="group relative flex h-full min-h-[26rem] w-full cursor-pointer overflow-hidden rounded-3xl border-3 border-black bg-white text-left shadow-[5px_5px_0px_0px_rgba(0,0,0,0.45)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,0.55)]"
    >
      <div className="card-flip-wrapper">
        <div className="card-flip">
          <div className="card-face card-face--front bg-white">
            <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
              {/* image container */}
              <div className="absolute inset-0">
                <img
                  src={dish.image || "/assets/placeholder.svg"}
                  alt={dish.name}
                  className="h-full w-full object-cover object-center"
                />

                <div className="absolute inset-0 bg-gradient-to-br from-[#030804]/70 via-[#05140d]/35 to-transparent"></div>

                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#030804]/85 via-transparent to-transparent"></div>
              </div>

              {/* badges above image */}
              <div className="absolute left-3 top-3 z-10 rounded-full bg-green-700 px-3 py-1 text-xs font-bold text-white">
                🌿 Plant-based swap
              </div>
              <div className="absolute right-3 bottom-3 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-black shadow">
                💧 Water saved · 🌍 CO₂ reduced
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between px-4 py-3 text-slate-900">
              <div className="space-y-2">
                <p className="font-impact text-2xl uppercase text-black">{dish.name}</p>
                <p className="text-sm font-semibold text-slate-600">{dish.region} · {dish.course}</p>
                {dish.replaces.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Replaces: {dish.replaces.slice(0, 2).join(", ")}{dish.replaces.length > 2 ? "..." : ""}
                  </p>
                )}
                {ratingValue && (
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-highlight px-3 py-1 text-xs font-bold text-black">
                    <span className="material-symbols-outlined text-sm">workspace_premium</span>
                    ⭐ {ratingValue} texture score
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-700">
                {viewedBy && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    <span className="material-symbols-outlined text-base text-primary">visibility</span>
                    Viewed by {viewedBy} people
                  </span>
                )}
                {nutritionMatchLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    <span className="material-symbols-outlined text-base text-primary">verified</span>
                    {nutritionMatchLabel}
                  </span>
                )}
                <span className="rounded-full border-2 border-primary bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  View Recipe →
                </span>
                {engineMeta?.priceRange && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    <span className="material-symbols-outlined text-base text-primary">sell</span>
                    {engineMeta.priceRange}
                  </span>
                )}
                {engineMeta?.protein && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    <span className="material-symbols-outlined text-base text-primary">fitness_center</span>
                    {engineMeta.protein}
                  </span>
                )}
                {liveScoreLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    <span className="material-symbols-outlined text-base text-primary">military_tech</span>
                    {liveScoreLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="card-face card-face--back bg-white p-4 text-left text-slate-800">
            <p className="font-impact text-xl uppercase text-black">Ingredient board</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Prep list</p>
            {ingredients.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-600">
                {ingredients.map((ingredient) => (
                  <li key={`${dish.slug}-${ingredient.item}`}>{ingredient.item} · {ingredient.quantity}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Ingredient details coming soon.</p>
            )}
            {chefTips.length > 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                <p className="mb-1 font-impact text-base uppercase text-black">Chef tips</p>
                <ul className="list-disc space-y-1 pl-4">
                  {chefTips.map((tip) => (
                    <li key={`${dish.slug}-${tip}`}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-auto text-xs font-bold uppercase text-slate-400">Hover to return</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function ChecklistRow({ label, value, note, status }: { label: string; value: string; note: string; status: string }) {
  return (
    <div className="grid grid-cols-2 items-center px-4 py-3 sm:grid-cols-4">
      <span className="font-bold text-black">{label}</span>
      <span>{value}</span>
      <span className="hidden text-slate-600 sm:block">{note}</span>
      <span className="hidden rounded-full bg-highlight px-3 py-1 text-xs font-black uppercase text-primary sm:inline-block">{status}</span>
    </div>
  );
}

export default function SwapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-highlight" aria-live="polite" />}>
      <SwapPageInner />
    </Suspense>
  );
}
