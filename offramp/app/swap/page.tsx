"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import { useSearchParams } from "next/navigation";
import { DISH_CATALOG, type DishDetail as DishDetailType } from "../../lib/dishes";
import { DishDetail } from "../components/DishDetail";
import { NavAuthButton } from "@/app/components/NavAuthButton";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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

type SwapRecordNotice = {
  tone: "success" | "error";
  text: string;
};

type RecordSwapOptions = {
  rating?: number;
  imageUrl?: string;
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

const keywordToCategoryMap: Record<string, string[]> = {
  chicken: ["chicken"],
  mutton: ["mutton"],
  beef: ["mutton"],
  lamb: ["mutton"],
  fish: ["seafood"],
  prawn: ["seafood"],
  egg: ["egg"],
};

const ALLERGEN_OPTIONS = [
  { id: "gluten_free", label: "Gluten" },
  { id: "nut_free", label: "Nuts" },
  { id: "soy_free", label: "Soy" },
  { id: "onion_free", label: "Onion" },
  { id: "garlic_free", label: "Garlic" },
];

const DEFAULT_TEXTURE_TARGET = 0.85;

type PlantSearchFilters = {
  dietaryRestrictions: string[];
  texturePreference: number | null;
};

type TargetDiet = DishDetailType["diet"] | null;

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

const normalizeTransitionDiet = (value: string | null | undefined) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "vegetarian") return "veg";
  if (normalized === "nonveg" || normalized === "non_veg") return "non-vegan";
  return normalized;
};

const toFrontendTargetDiet = (value: string | null | undefined): TargetDiet => {
  const normalized = normalizeTransitionDiet(value);
  if (normalized === "vegan") return "vegan";
  if (normalized === "veg") return "vegetarian";
  if (normalized === "jain") return "jain";
  return null;
};

const toSuggestionFromFilter = (value: string | null | undefined) => {
  const normalized = normalizeTransitionDiet(value);
  if (!normalized) return undefined;
  if (normalized === "non-vegan") return "non-vegan";
  if (normalized === "veg") return "veg";
  if (normalized === "vegan") return "vegan";
  if (normalized === "jain") return "jain";
  if (normalized === "keto") return "keto";
  return undefined;
};

const targetDietLabel = (diet: TargetDiet) => {
  if (diet === "vegan") return "Vegan";
  if (diet === "vegetarian") return "Vegetarian";
  if (diet === "jain") return "Jain";
  return null;
};

const DIET_LABEL_BADGES: Record<DishDetailType["diet"], { src: string; label: string; alt: string }> = {
  vegan: {
    src: "/Labels/vegan.png",
    label: "Vegan",
    alt: "Vegan label",
  },
  vegetarian: {
    src: "/Labels/vegetarian.png",
    label: "Vegetarian",
    alt: "Vegetarian label",
  },
  jain: {
    src: "/Labels/jain.png",
    label: "Jain",
    alt: "Jain label",
  },
};

const DIET_LABEL_ORDER: DishDetailType["diet"][] = ["vegan", "vegetarian", "jain"];

const getDietBadge = (dietValue: string | null | undefined) => {
  const normalized = typeof dietValue === "string" ? dietValue.trim().toLowerCase() : "";
  if (normalized === "vegan") return DIET_LABEL_BADGES.vegan;
  if (normalized === "veg" || normalized === "vegetarian") return DIET_LABEL_BADGES.vegetarian;
  if (normalized === "jain") return DIET_LABEL_BADGES.jain;
  return null;
};

const matchesTransitionToStrict = (dish: DishDetailType | undefined, transitionTo: string | null | undefined) => {
  const normalizedTo = normalizeTransitionDiet(transitionTo);
  const allowedTargets = new Set(["non-vegan", "veg", "vegetarian", "vegan", "jain", "keto"]);
  if (!normalizedTo || !allowedTargets.has(normalizedTo)) return true;
  if (!dish) return false;
  const rawDishDiet = typeof dish.diet === "string" ? dish.diet.trim().toLowerCase() : "";
  const normalizedDishDiet = normalizeTransitionDiet(rawDishDiet) ?? rawDishDiet;
  if (normalizedTo === "veg" || normalizedTo === "vegetarian") {
    return normalizedDishDiet === "veg" || normalizedDishDiet === "vegetarian";
  }
  return normalizedDishDiet === normalizedTo;
};

const matchesTargetDiet = (dish: DishDetailType | undefined, targetDiet: TargetDiet) => {
  if (!targetDiet) return true;
  if (!dish) return false;
  if (targetDiet === "vegan") return dish.diet === "vegan";
  if (targetDiet === "vegetarian") {
    return dish.diet === "vegetarian" || dish.diet === "vegan" || dish.diet === "jain";
  }
  return dish.diet === "jain";
};

const formatAllergenLabel = (value: string) => {
  const match = ALLERGEN_OPTIONS.find((entry) => entry.id === value);
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

const shouldReportSmartSearchError = (error: unknown) => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return false;
  }
  return !(error instanceof PlantSearchError);
};

function SwapPageInner() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [normalizedSearchTerm, setNormalizedSearchTerm] = useState("");
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
  const [savedTransitionFromDiet, setSavedTransitionFromDiet] = useState<string | null>(null);
  const [savedTransitionToDiet, setSavedTransitionToDiet] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const demoParam = searchParams?.get("demo");
  const transitionFromDiet = useMemo(() => {
    const fromParam = normalizeTransitionDiet(searchParams?.get("from") ?? null);
    return savedTransitionFromDiet ?? fromParam;
  }, [savedTransitionFromDiet, searchParams]);
  const transitionToDiet = useMemo(() => {
    const toParam = normalizeTransitionDiet(searchParams?.get("to") ?? null);
    return savedTransitionToDiet ?? toParam;
  }, [savedTransitionToDiet, searchParams]);
  const targetDiet = useMemo(() => toFrontendTargetDiet(transitionToDiet), [transitionToDiet]);
  const suggestionFromFilter = useMemo(() => toSuggestionFromFilter(transitionFromDiet), [transitionFromDiet]);
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
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [allergenMenuOpen, setAllergenMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [recordingSwapKey, setRecordingSwapKey] = useState<string | null>(null);
  const [swapRecordNotice, setSwapRecordNotice] = useState<SwapRecordNotice | null>(null);
  const [midCtaNotice, setMidCtaNotice] = useState<string | null>(null);

  const filterMenuRef = useRef<HTMLDivElement>(null);
  const allergenMenuRef = useRef<HTMLDivElement>(null);
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

    const matchesPriceBand = (dish: DishDetailType | undefined, band: "low" | "premium") => {
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

  const matchesActiveFilters = (dish?: DishDetailType) => {
    if (!activeFilters.length) return true;
    if (!dish) return false;
    return activeFilters.every((filterId) => {
      const predicate = filterPredicates[filterId];
      return predicate ? predicate(dish) : true;
    });
  };

  const toggleFilterMenu = () => {
    setFilterMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        setAllergenMenuOpen(false);
      }
      return next;
    });
  };

  const toggleAllergenMenu = () => {
    setAllergenMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        setFilterMenuOpen(false);
      }
      return next;
    });
  };

  const handleFilterToggle = (optionId: string) => {
    setActiveFilters((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]));
  };

  const clearFilters = () => setActiveFilters([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setFilterMenuOpen(false);
      }
      if (allergenMenuRef.current && !allergenMenuRef.current.contains(event.target as Node)) {
        setAllergenMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFilterMenuOpen(false);
        setAllergenMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) return;
        if (!isMounted) return;

        const { data: profile } = await supabase
          .from("users")
          .select("transition_from_diet, transition_to_diet")
          .eq("id", user.id)
          .maybeSingle();
        if (!profile || !isMounted) return;

        setSavedTransitionFromDiet(normalizeTransitionDiet(profile.transition_from_diet));
        setSavedTransitionToDiet(normalizeTransitionDiet(profile.transition_to_diet));
      } catch {
        // Ignore and keep default behavior for anonymous users.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    (async () => {
      const [healthResult, dishesResult] = await Promise.allSettled([
        healthCheck(controller.signal),
        getAllDishes({ from: suggestionFromFilter, signal: controller.signal }),
      ]);

      if (!isMounted) return;

      if (healthResult.status === "fulfilled") {
        setEngineHealth(healthResult.value);
      } else {
        setEngineHealth(null);
        if (shouldReportSmartSearchError(healthResult.reason)) {
          console.error("Smart Search health check failed", healthResult.reason);
        }
      }

      if (dishesResult.status === "fulfilled") {
        const uniqueDishNames = Array.from(
          new Set(
            dishesResult.value
              .map((dish) => dish.name?.trim())
              .filter((name): name is string => Boolean(name))
          )
        );
        setBackendDishNames(uniqueDishNames);

        const spotlightCandidate = dishesResult.value.find((dish) => dish.category === "vegan");
        if (spotlightCandidate) {
          try {
            const detail = await getDish(spotlightCandidate.name, controller.signal);
            if (isMounted) {
              setSpotlightDish(detail);
            }
          } catch (error) {
            if (shouldReportSmartSearchError(error)) {
              console.error("Failed to fetch spotlight dish", error);
            }
          }
        }
      } else {
        setBackendDishNames([]);
        if (shouldReportSmartSearchError(dishesResult.reason)) {
          console.error("Smart Search bootstrap failed", dishesResult.reason);
        }
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [suggestionFromFilter]);

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
          from: transitionFromDiet ?? undefined,
          to: transitionToDiet ?? undefined,
          signal,
        });

        if (requestId !== undefined && requestId !== swapRequestIdRef.current) {
          return;
        }

        const targetFilteredDishes = (dishes ?? []).filter(
          (dish) =>
            matchesTargetDiet(dish, targetDiet) &&
            matchesTransitionToStrict(dish, transitionToDiet)
        );
        const rankedRecommendations = raw
          .map((result, index) => ({ result, detail: dishes[index] }))
          .filter(
            ({ detail }) =>
              matchesTargetDiet(detail, targetDiet) &&
              matchesTransitionToStrict(detail, transitionToDiet)
          )
          .slice(0, 3)
          .map(({ result, detail }) => toPlantRecommendation(result, detail));

        setSwapEngineDishes(targetFilteredDishes);
        setPlantRecommendations(rankedRecommendations);
        const summary = summarizeRawResults(raw);
        const label = targetDietLabel(targetDiet);
        setSwapEngineMeta({
          ...createEmptySwapMeta(),
          appliedRestrictions: filters.dietaryRestrictions,
          texturePreference:
            typeof filters.texturePreference === "number" ? filters.texturePreference : null,
          originalDish: normalized,
          engine: raw.length ? "plant-search" : undefined,
          priceRanges: summary.priceRanges,
          proteinTags: summary.proteinTags,
          availabilityTags: label ? [label, ...summary.availabilityTags] : summary.availabilityTags,
        });
        setSwapEngineError(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (requestId !== undefined && requestId !== swapRequestIdRef.current) {
          return;
        }
        if (shouldReportSmartSearchError(error)) {
          console.error("Smart Search engine error", error);
        }
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
    [targetDiet, transitionFromDiet, transitionToDiet]
  );

  useEffect(() => {
    const normalized = normalizedSearchTerm.trim();
    const requestTerm = normalized || searchTerm.trim();

    if (!requestTerm) {
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
    fetchPlantSearchResults,
  ]);

  const swapResults = useMemo(() => {
    if (!swapEngineDishes.length) {
      return [];
    }

    const restrictionLabels = (swapEngineMeta.appliedRestrictions ?? []).map((value) => formatAllergenLabel(value));
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
        title: swapEngineMeta.originalDish ? `Live swaps for ${swapEngineMeta.originalDish}` : "Smart Search recommendations",
        keywords: swapEngineMeta.originalDish ? [swapEngineMeta.originalDish] : [],
        description: metaParts.length ? metaParts.join(" • ") : "Smart matches from the Smart Search engine.",
        dishes: swapEngineDishes,
      },
    ];
  }, [swapEngineDishes, swapEngineMeta]);
  const processedSwapResults = useMemo(() => {
    if (!swapResults.length) return [];

    return swapResults
      .map((group) => {
        let dishes = [...group.dishes];
        if (activeFilters.length) {
          dishes = dishes.filter((dish) => matchesActiveFilters(dish));
        }
        return { ...group, dishes };
      })
      .filter((group) => group.dishes.length > 0);
  }, [swapResults, activeFilters, filterPredicates, dishMeta]);

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
    const backendMatches = backendDishNames.filter((name) => name.toLowerCase().includes(lower));
    if (suggestionFromFilter) {
      return [...new Set(backendMatches)].slice(0, 10);
    }
    const matchingNonVeg = SEARCH_KEYWORDS.filter((kw) => kw.includes(lower) || lower.includes(kw));
    const dishNames = dishes.map((d) => d.name).filter((name) => name.toLowerCase().includes(lower));
    const mappedAlternatives = keywordAlternatives
      .flatMap((group) => group.items.map((item) => item.name))
      .filter((name) => name.toLowerCase().includes(lower));
    return [...new Set([...matchingNonVeg, ...dishNames, ...mappedAlternatives, ...backendMatches])].slice(0, 10);
  }, [query, keywordAlternatives, backendDishNames, suggestionFromFilter]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [suggestions]);

  const rawHasSwapResults = swapResults.length > 0;
  const hasSwapResults = processedSwapResults.length > 0;
  const activeFilterCount = activeFilters.length;
  const activeAllergenCount = dietaryRestrictions.length;
  const filterButtonLabel = activeFilterCount ? `Filter (${activeFilterCount})` : "Filter";
  const allergenButtonLabel = activeAllergenCount ? `Allergen (${activeAllergenCount})` : "Allergen";
  const noResultsWithFilters = searchTerm && rawHasSwapResults && !hasSwapResults;
  const shouldShowSuggestions =
    suggestions.length > 0 && (!searchTerm.trim() || query.trim() !== searchTerm.trim());

  // Handle search submission
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setNormalizedSearchTerm(term.trim());
  };

  const handleSuggestionSelect = (value: string) => {
    setQuery(value);
    handleSearch(value);
    setActiveSuggestionIndex(-1);
  };

  const handleSearchInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowSuggestions) return;
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

  const handleRecordSwap = useCallback(
    async (dish: DishDetailType, fromDishCandidate: string, options?: RecordSwapOptions) => {
      const toDish = dish.name?.trim();
      const fromDish = fromDishCandidate.trim();
      if (!toDish || !fromDish) {
        setSwapRecordNotice({ tone: "error", text: "Unable to record swap right now." });
        return { ok: false, error: "Unable to record swap right now." };
      }

      const recordKey = `${fromDish}->${toDish}`;
      if (recordingSwapKey) {
        return { ok: false, error: "Swap recording already in progress." };
      }

      setRecordingSwapKey(recordKey);
      setSwapRecordNotice(null);

      try {
        const response = await fetch("/api/swaps/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            fromDish,
            toDish,
            fromCategory: transitionFromDiet ?? undefined,
            toCategory: transitionToDiet ?? undefined,
            rating: typeof options?.rating === "number" ? options.rating : typeof dish.rating === "number" ? Math.round(dish.rating) : undefined,
            imageUrl: options?.imageUrl || dish.image || undefined,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          if (response.status === 401) {
            setSwapRecordNotice({ tone: "error", text: "Login required to record swaps." });
            return { ok: false, error: "Login required to record swaps." };
          }
          const message = payload?.error || "Failed to record swap.";
          setSwapRecordNotice({ tone: "error", text: message });
          return { ok: false, error: message };
        }

        setSwapRecordNotice({ tone: "success", text: "Swap recorded!" });
        return { ok: true };
      } catch {
        setSwapRecordNotice({ tone: "error", text: "Failed to record swap." });
        return { ok: false, error: "Failed to record swap." };
      } finally {
        setRecordingSwapKey(null);
      }
    },
    [recordingSwapKey, transitionFromDiet, transitionToDiet]
  );

  const handleMidSwapNow = useCallback(async () => {
    setMidCtaNotice(null);

    if (selectedDish) {
      const fromDishName =
        selectedDish.matchMeta?.originalDish?.trim() ||
        normalizedSearchTerm ||
        searchTerm.trim() ||
        selectedDish.replaces?.[0] ||
        selectedDish.name;
      await handleRecordSwap(selectedDish, fromDishName);
      return;
    }

    const resultsSection = document.getElementById("swap-results");
    resultsSection?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (!hasSwapResults) {
      setMidCtaNotice("Select a swap first.");
      return;
    }

    setMidCtaNotice("Select a swap card and tap Swap Now.");
  }, [handleRecordSwap, hasSwapResults, normalizedSearchTerm, searchTerm, selectedDish]);

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
    if (targetDiet) {
      picks = picks.filter(({ detail }) => matchesTargetDiet(detail, targetDiet));
    }
    if (activeFilters.length) {
      picks = picks.filter(({ detail }) => matchesActiveFilters(detail));
    }
    return picks.map(({ dish }) => dish).slice(0, 8);
  }, [query, topPicksWithDetail, targetDiet, activeFilters]);

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
          onSwapNowFromReview={async (rating, imageUrl) => {
            const fromDishName =
              selectedDish.matchMeta?.originalDish?.trim() ||
              normalizedSearchTerm ||
              searchTerm.trim() ||
              selectedDish.replaces?.[0] ||
              selectedDish.name;
            return handleRecordSwap(selectedDish, fromDishName, { rating, imageUrl });
          }}
        />
      </main>
    );
  }

  return (
    <main className={`${jakarta.className} ${impact.variable} min-h-screen bg-highlight text-slate-900`}>
      <nav className="sticky top-0 z-50 border-b-3 border-black bg-highlight/90 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="group flex items-center gap-1">
            <img
              src="/logo.png"
              alt="OffRamp logo"
              className="w-28 rounded-full object-contain transition-transform duration-300 group-hover:rotate-6 sm:w-40"
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
            <Link href="/coming-soon" className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              Coming Soon
            </Link>
            <Link href="/about" className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              About
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-white text-black md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <span className="material-symbols-outlined text-xl">{mobileMenuOpen ? "close" : "menu"}</span>
            </button>
            {isDemo ? (
              <div className="hidden items-center gap-2 rounded-full border-2 border-black bg-white px-6 py-2 text-sm font-black uppercase text-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:flex">
                <span className="material-symbols-outlined text-base text-primary">verified</span>
                Demo
              </div>
            ) : (
              <NavAuthButton className="hidden transform items-center gap-2 rounded-full border-2 border-black px-8 py-2 text-sm font-bold uppercase transition-all duration-300 hover:scale-105 hover:bg-black hover:text-white md:flex" />
            )}
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t-2 border-black bg-white px-4 py-4 md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-bold uppercase tracking-wider">
              <Link href="/#home" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/swap" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)}>
                Food Swap
              </Link>
              <Link href="/coming-soon" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)}>
                Coming Soon
              </Link>
              <Link href="/about" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16">
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

      <section id="search" className="px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="relative mb-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}
              className="flex flex-wrap items-center gap-3 rounded-2xl border-3 border-black bg-white px-4 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:px-5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
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
                    }}
                    className="text-slate-500 transition hover:text-black"
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-end">
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
                <div className="relative" ref={allergenMenuRef}>
                  <button
                    type="button"
                    onClick={toggleAllergenMenu}
                    aria-haspopup="menu"
                    aria-expanded={allergenMenuOpen}
                    className={`flex items-center gap-2 rounded-full border-2 border-black px-4 py-2 text-sm font-bold uppercase transition transform ${
                      activeAllergenCount ? "bg-accent text-white" : "bg-white text-black"
                    } hover:-translate-y-[1px] hover:bg-accent hover:text-white`}
                  >
                    {allergenButtonLabel}
                    <span
                      className={`material-symbols-outlined text-base transition ${allergenMenuOpen ? "rotate-180" : ""}`}
                    >
                      expand_more
                    </span>
                  </button>
                  {allergenMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border-3 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {ALLERGEN_OPTIONS.map((option) => {
                        const isActive = dietaryRestrictions.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={isActive}
                            onClick={() => toggleRestriction(option.id)}
                            className={`flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition hover:bg-highlight ${
                              isActive ? "text-primary" : "text-slate-700"
                            }`}
                          >
                            {option.label}
                            {isActive && <span className="material-symbols-outlined text-base">check</span>}
                          </button>
                        );
                      })}
                      {dietaryRestrictions.length > 0 && (
                        <button
                          type="button"
                          className="flex w-full items-center justify-center border-t border-black/10 px-4 py-2 text-xs font-bold uppercase text-slate-500 transition hover:text-black"
                          onClick={() => {
                            setDietaryRestrictions([]);
                            setAllergenMenuOpen(false);
                          }}
                        >
                          Clear allergens
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
                  Smart Search tuning
                  {swapEngineLoading && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[10px] font-semibold text-primary">
                      <span className="material-symbols-outlined text-base">motion_photos_auto</span>
                      syncing
                    </span>
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
            {shouldShowSuggestions && (
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

      <section className="px-6 pb-8">
        <div className="mx-auto max-w-6xl text-center">
          <button
            type="button"
            onClick={() => void handleMidSwapNow()}
            className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-accent px-8 py-3 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[5px_5px_0px_0px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:bg-black"
          >
            <span className="material-symbols-outlined text-base">swap_horiz</span>
            Swap Now
          </button>
          {midCtaNotice && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{midCtaNotice}</p>
          )}
        </div>
      </section>

	      {/* Swap Results Section */}
	      {hasSwapResults && (
        <section id="swap-results" className="px-6 pb-12">
          <div className="mx-auto max-w-6xl space-y-6">
            {swapRecordNotice && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  swapRecordNotice.tone === "success"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-red-300 bg-red-50 text-red-700"
                }`}
              >
                {swapRecordNotice.text}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Label index</span>
              {DIET_LABEL_ORDER.map((dietKey) => {
                const badge = DIET_LABEL_BADGES[dietKey];
                return (
                  <span
                    key={dietKey}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                  >
                    <Image
                      src={badge.src}
                      alt={badge.alt}
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] rounded-md object-cover"
                    />
                    {badge.label}
                  </span>
                );
              })}
            </div>
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
                  {group.dishes.map((dish) => {
                    const fromDishName =
                      dish.matchMeta?.originalDish?.trim() ||
                      normalizedSearchTerm ||
                      searchTerm.trim() ||
                      dish.replaces?.[0] ||
                      dish.name;
                    const recordKey = `${fromDishName}->${dish.name}`;
                    return (
                      <SwapResultCard
                        key={dish.slug}
                        dish={dish}
                        onSelect={() => handleSelectDish(dish)}
                        onRecordSwap={() => void handleRecordSwap(dish, fromDishName)}
                        swapNowDisabled={recordingSwapKey === recordKey}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Ethical Micro-Feedback */}
            <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-6 py-4 text-center">
              <p className="text-sm font-medium text-primary">
                Small swaps like these reduce environmental impact without changing what you love to eat.
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
              Try removing one of the filters to see every available swap for "{searchTerm}".
            </p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setActiveFilters([]);
                }}
                className="rounded-full border-2 border-black bg-black px-5 py-2 text-xs font-bold uppercase text-white transition hover:bg-accent"
              >
                Reset filters
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

      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
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

      <footer className="border-t-3 border-black bg-white px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 md:flex-row">
          <div className="group flex items-center gap-1">
            <img
              src="/image.png"
              alt="OffRamp logo"
              className="h-20 w-20 rounded-full object-contain transition-transform duration-300 group-hover:rotate-6 sm:h-[120px] sm:w-[120px]"
            />
            <span className="font-impact text-3xl uppercase sm:text-4xl">OffRamp</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-black uppercase tracking-[0.18em] sm:gap-8 sm:text-sm sm:tracking-widest">
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
    <div className="group relative w-[min(18rem,82vw)] shrink-0 snap-start overflow-hidden rounded-3xl border-3 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.45)] transition duration-300 hover:-translate-y-2 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.55)] sm:w-72">
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
  const imageSrc = recommendation.detail?.image || "/assets/placeholder.svg";

  return (
 <button
      type="button"
      onClick={recommendation.detail ? onSelect : undefined}
      className="flex h-full flex-col gap-4 rounded-3xl border-3 border-black bg-white px-5 py-5 text-left shadow-[5px_5px_0px_0px_rgba(0,0,0,0.4)] transition duration-300 hover:-translate-y-1 hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,0.5)]"
    >
      <div className="relative -mx-1 h-50 overflow-hidden rounded-2xl border-2 border-black/10 sm:h-50">
        <img
          src={imageSrc}
          alt={recommendation.name}
          className="absolute inset-0 h-full w-full object-contain object-center"
          onError={(event) => {
            const target = event.currentTarget;
            if (target.dataset.fallbackApplied === "true") return;
            target.dataset.fallbackApplied = "true";
            target.src = "/assets/placeholder.svg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      </div>
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
function SwapResultCard({
  dish,
  onSelect,
  onRecordSwap,
  swapNowDisabled,
}: {
  dish: DishDetailType;
  onSelect: () => void;
  onRecordSwap: () => void;
  swapNowDisabled: boolean;
}) {
  const viewedBy = typeof dish.reviews === "number" ? dish.reviews.toLocaleString() : null;
  const ingredients = dish.ingredients?.slice(0, 5) || [];
  const chefTips = dish.chefTips?.slice(0, 2) || [];
  const engineMeta = dish.matchMeta;
  const dietBadge = getDietBadge(dish.diet);
  const nutritionMatchLabel = formatMatchScoreLabel(engineMeta?.score);
  const ratingValue = typeof dish.rating === "number" ? dish.rating.toFixed(1) : null;
  const liveScoreLabel = typeof engineMeta?.score === "number" ? `${Math.round(engineMeta.score * 100)}% live score` : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      suppressHydrationWarning
      className="group relative flex h-full min-h-[28rem] w-full cursor-pointer overflow-hidden rounded-3xl border-3 border-black bg-white text-left shadow-[5px_5px_0px_0px_rgba(0,0,0,0.45)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,0.55)]"
    >
      <div className="card-flip-wrapper">
        <div className="card-flip">
          <div className="card-face card-face--front bg-white">
            <div className="relative h-60 w-full overflow-hidden rounded-t-xl">
              <div className="absolute inset-0">
                <img
                  src={dish.image || "/assets/placeholder.svg"}
                  alt={dish.name}
                  className="h-full w-full object-contain object-center"
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (target.dataset.fallbackApplied === "true") return;
                    target.dataset.fallbackApplied = "true";
                    target.src = "/assets/placeholder.svg";
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-br from-[#030804]/70 via-[#05140d]/35 to-transparent"></div>

                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#030804]/85 via-transparent to-transparent"></div>
              </div>

              {/* badges above image */}
              {dietBadge && (
                <div className="absolute left-3 top-3 z-10 rounded-2xl border border-white/70 bg-white/95 p-1 shadow">
                  <Image
                    src={dietBadge.src}
                    alt={dietBadge.alt}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-xl object-cover"
                  />
                </div>
              )}
              <div className="absolute right-3 bottom-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-black shadow">
                <span className="material-symbols-outlined text-xs">water_drop</span>
                Water saved · CO2 reduced
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 px-4 py-3 text-slate-900">
              <div className="space-y-1">
                <p className="truncate font-impact text-2xl uppercase text-black">{dish.name}</p>
                <p className="truncate text-sm font-semibold text-slate-600">{dish.region} · {dish.course}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Replaces</p>
                <p className="truncate text-xs font-semibold text-slate-700">
                  {dish.replaces.length > 0
                    ? `${dish.replaces.slice(0, 2).join(", ")}${dish.replaces.length > 2 ? "..." : ""}`
                    : "Direct plant-based recommendation"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                {ratingValue && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    <span className="material-symbols-outlined text-base text-primary">workspace_premium</span>
                    {ratingValue}
                  </span>
                )}
                {nutritionMatchLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    <span className="material-symbols-outlined text-base text-primary">verified</span>
                    {nutritionMatchLabel}
                  </span>
                )}
                {engineMeta?.priceRange && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    <span className="material-symbols-outlined text-base text-primary">sell</span>
                    {engineMeta.priceRange}
                  </span>
                )}
                {engineMeta?.protein && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    <span className="material-symbols-outlined text-base text-primary">fitness_center</span>
                    {engineMeta.protein}
                  </span>
                )}
                {liveScoreLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    <span className="material-symbols-outlined text-base text-primary">military_tech</span>
                    {liveScoreLabel}
                  </span>
                )}
                {viewedBy && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    <span className="material-symbols-outlined text-base text-primary">visibility</span>
                    {viewedBy} views
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRecordSwap();
                  }}
                  disabled={swapNowDisabled}
                  className="rounded-full border-2 border-black bg-black px-3 py-1 text-xs font-bold uppercase text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {swapNowDisabled ? "Recording..." : "Swap Now"}
                </button>
                <span className="rounded-full border-2 border-primary bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  View Recipe →
                </span>
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
    </div>
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
