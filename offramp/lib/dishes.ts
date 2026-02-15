import mockData from "../Mock.json";

export type DishMatchMeta = {
  source?: "plant-search" | "local";
  priceRange?: string;
  protein?: string;
  availability?: string;
  score?: number;
  reasons?: string[];
  dishId?: string | number;
  originalDish?: string;
};

export type DishDetail = {
  slug: string;
  name: string;
  diet: "vegan" | "vegetarian" | "jain";
  course: string;
  flavorProfile: string;
  state: string;
  region: string;
  replaces: string[];
  ingredients: { item: string; quantity: string }[];
  prepTime: string;
  cookTime: string;
  totalTime: string;
  steps: { step: number; instruction: string; time: string }[];
  chefTips: string[];
  whyItWorks: string;
  image: string;
  videoId?: string;
  categories: string[];
  rating?: number;
  reviews?: number;
  trendingCity?: string;
  heroSummary?: string;
  calories?: number;
  protein?: number;
  fiber?: number;
  priceOriginal?: number;
  priceSwap?: number;
  estimatedCost?: number;
  matchMeta?: DishMatchMeta;
};

export type ReplacementCategory = {
  id: string;
  title: string;
  keywords: string[];
  description: string;
};

export type ReplacementGroup = {
  id: string;
  title: string;
  keywords: string[];
  description: string;
  dishes: DishDetail[];
};

type RawDish = {
  slug: string;
  name: string;
  diet: string;
  course: string;
  flavorProfile: string;
  state: string;
  region: string;
  replaces: string[];
  ingredients: { item: string; quantity: string }[];
  prepTime: string;
  cookTime: string;
  totalTime: string;
  steps: { step: number; instruction: string; time: string }[];
  chefTips: string[];
  whyItWorks: string;
  heroSummary?: string;
  image: string;
  videoId?: string;
  categories: string[];
  rating?: number;
  reviews?: number;
  trendingCity?: string;
  calories?: number;
  protein?: number;
  fiber?: number;
  priceOriginal?: number;
  priceSwap?: number;
  estimatedCost?: number;
};

type RawDishesFile = {
  VEGAN: RawDish[];
  VEG: RawDish[];
  JAIN: RawDish[];
};

const RAW_MOCK = mockData as RawDishesFile;

const IMAGE_MAP: Record<string, string> = {
  // Vegan
  "baingan-bharta": "/assets/Images/Vegan/Baingan-Bharta.jpg",
  "chana-masala": "/assets/Images/Vegan/Chana-Masala.jpg",
  "aloo-gobi": "/assets/Images/Vegan/Aloo-Gobi.jpg",
  "vegetable-biryani": "/assets/Images/Vegan/Vegetable-Biryani.jpg",
  "rajma-masala": "/assets/Images/Vegan/Rajma-Masala.jpg",
  "masoor-dal-tadka": "/assets/Images/Vegan/Masoor-Dal-Tadka.jpg",
  "bhindi-masala": "/assets/Images/Vegan/Bhindi-Masala.jpg",
  "tofu-tikka": "/assets/Images/Vegan/Tofu-Tikka.jpg",
  "kachumber-salad": "/assets/Images/Vegan/Kachumber-Salad.jpg",
  "sprouted-mung-salad": "/assets/Images/Vegan/Sprouted-Mung-Salad.jpg",
  "coconut-sambar": "/assets/Images/Vegan/Coconut-Sambar.jpg",
  "vegetable-pulao": "/assets/Images/Vegan/Vegetable-Pulao.jpg",
  "sprouted-lentil-dhokla": "/assets/Images/Vegan/Sprouted-Lentil-Dhokla.jpg",
  "coriander-peanut-chutney": "/assets/Images/Vegan/Coriander-Peanut-Chutney.jpg",
  "methi-tofu-curry": "/assets/Images/Vegan/Methi-Tofu-Curry.jpg",
  "chow-chow-poriyal": "/assets/Images/Vegan/Chow-Chow-Poriyal.jpg",
  "mixed-vegetable-korma": "/assets/Images/Vegan/Mixed-Vegetable-Korma.jpg",

  // Vegetarian
  "paneer-butter-masala": "/assets/Images/Veg/Paneer-butter-masala.jpg",
  "palak-paneer": "/assets/Images/Veg/Palak-paneer.jpg",
  "malai-kofta": "/assets/Images/Veg/Malai-kofta.jpg",
  "dhokla": "/assets/Images/Veg/Dhokla.jpg",
  "samosa": "/assets/Images/Veg/Samosa.jpg",
  "masala-dosa": "/assets/Images/Veg/Masala-Dosa.jpg",
  "pav-bhaji": "/assets/Images/Veg/Pav-Bhaji.jpg",
  "aloo-paratha": "/assets/Images/Veg/Aloo-Paratha.jpg",
  "matar-paneer": "/assets/Images/Veg/Matar-Paneer.jpg",
  "gajar-halwa": "/assets/Images/Veg/Gajar-halwa.jpg",
  "besan-ladoo": "/assets/Images/Veg/Besan-Ladoo.jpg",
  "chole-bhature": "/assets/Images/Veg/Chole-Bhature.jpg",
  "veg-korma": "/assets/Images/Veg/Veg-Korma.jpg",
  "rajgira-kheer": "/assets/Images/Veg/Rajgira-Kheer.jpg",
  "paneer-tikka": "/assets/Images/Veg/Paneer-Tikka.jpg",
  "veg-biryani-rich": "/assets/Images/Veg/Veg-Biryani.jpg",

  // Jain
  "jain-dal-tadka": "/assets/Images/Jain/Jain-Dal-Tadka.jpg",
  "jain-pulao": "/assets/Images/Jain/Jain-Pulao.jpg",
  "jain-paneer-tikka": "/assets/Images/Jain/Jain-Paneer-Tikka.jpg",
  "jain-pav-bhaji": "/assets/Images/Jain/Jain-Pav-Bhaji.jpg",
  "jain-dhokla": "/assets/Images/Jain/Jain-Dhokla.jpg",
  "jain-chole": "/assets/Images/Jain/Jain-Chole.jpg",
  "jain-laal-saag": "/assets/Images/Jain/Jain-Laal-Saag.jpg",
  "jain-lauki-kofta": "/assets/Images/Jain/Jain-Lauki-Kofta.jpg",
  "jain-thepla": "/assets/Images/Jain/Jain-Methi-Thepla.jpg",
  "jain-khandvi": "/assets/Images/Jain/Jain-Khandvi.jpg",
  "jain-methi-muthia": "/assets/Images/Jain/Jain-Methi-Muthia.jpg",
  "jain-moong-cheela": "/assets/Images/Jain/Jain-Moong-Cheela.jpg",
  "jain-kadhi": "/assets/Images/Jain/Jain-Punjabi-Kadhi.jpg",
  "jain-bajara-roti-with-ghee": "/assets/Images/Jain/Jain-Bajra-Roti.jpg",
  "jain-shrikhand": "/assets/Images/Jain/Jain-Shrikhand.jpg",
  "jain-poha": "/assets/Images/Jain/Jain-Poha.jpg",
  "jain-punjabi-kadi-pakora-without-onion": "/assets/Images/Jain/Jain-Punjabi-Kadhi.jpg",
  "jain-khichdi": "/assets/Images/Jain/Jain-Khichdi.jpg",
};

const DEFAULT_IMAGE_FOLDER: Record<DishDetail["diet"], string> = {
  vegan: "Vegan",
  vegetarian: "Veg",
  jain: "Jain",
};

export const REPLACEMENT_CATEGORIES: ReplacementCategory[] = [
  {
    id: "chicken",
    title: "Chicken & Poultry Swaps",
    keywords: ["chicken", "poultry", "drumstick", "chops"],
    description: "Tender, high-protein alternatives that keep the spice balance intact.",
  },
  {
    id: "seafood",
    title: "Seafood Swaps",
    keywords: ["fish", "prawn", "shrimp", "seafood"],
    description: "Ocean-inspired textures using coastal-friendly produce.",
  },
  {
    id: "egg",
    title: "Egg Swaps",
    keywords: ["egg", "omelette", "scramble"],
    description: "Protein-rich replacements that stay fluffy and satisfying.",
  },
  {
    id: "mutton",
    title: "Mutton & Red Meat Swaps",
    keywords: ["mutton", "lamb", "goat", "beef"],
    description: "Slow-cooked comfort foods reimagined with plants.",
  },
  {
    id: "salad",
    title: "Salad Swaps",
    keywords: ["salad", "caesar", "greens"],
    description: "Fresh, crunchy bowls with bright dressings and plant protein.",
  },
  {
    id: "dosa",
    title: "Dosa & South Indian Swaps",
    keywords: ["dosa", "uttapam", "south indian"],
    description: "Crispy crepes and tiffin favorites with plant-forward fillings.",
  },
  {
    id: "sandwich",
    title: "Sandwich & Wrap Swaps",
    keywords: ["sandwich", "wrap", "toast"],
    description: "Quick handheld meals with hearty, veg-first fillings.",
  },
  {
    id: "cheese",
    title: "Cheesy & Creamy Swaps",
    keywords: ["cheese", "paneer", "cream", "creamy", "dairy"],
    description: "Comfort textures using nuts, coconut, tofu, or lighter dairy.",
  },
  {
    id: "pasta",
    title: "Pasta Comfort Swaps",
    keywords: ["pasta", "carbonara", "mac", "macaroni"],
    description: "Creamy comfort vibes—mapped to the closest Indian plant-based equivalents.",
  },
  {
    id: "pizza",
    title: "Pizza-style Comfort Swaps",
    keywords: ["pizza"],
    description: "Party-friendly comfort picks when you want that indulgent bite.",
  },
];

const slugToFileName = (slug: string) =>
  `${slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-")}.jpg`;

const normalizeDiet = (key: keyof RawDishesFile): DishDetail["diet"] => {
  if (key === "VEGAN") return "vegan";
  if (key === "VEG") return "vegetarian";
  return "jain";
};

const normalizeDish = (dish: RawDish, dietKey: keyof RawDishesFile): DishDetail => {
  const diet = normalizeDiet(dietKey);
  const image =
    IMAGE_MAP[dish.slug] ?? `/assets/Images/${DEFAULT_IMAGE_FOLDER[diet]}/${slugToFileName(dish.slug)}`;

  return {
    ...dish,
    diet,
    image,
    ingredients: dish.ingredients ?? [],
    steps: dish.steps ?? [],
    chefTips: dish.chefTips ?? [],
    categories: dish.categories ?? [],
    replaces: dish.replaces ?? [],
  };
};

export const DISH_CATALOG: DishDetail[] = ("VEGAN,VEG,JAIN".split(",") as Array<keyof RawDishesFile>)
  .flatMap((dietKey) => (RAW_MOCK[dietKey] ?? []).map((dish) => normalizeDish(dish, dietKey)));

export function getDishBySlug(slug: string): DishDetail | undefined {
  return DISH_CATALOG.find((dish) => dish.slug === slug);
}

export function findReplacementGroups(query: string): ReplacementGroup[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const normalized = trimmed.toLowerCase();

  const tokenize = (value: string) => Array.from(new Set(value.split(/[^a-z0-9]+/g).filter(Boolean)));
  const slugify = (value: string) => tokenize(value).join("-");

  const addAll = (set: Set<string>, values: string[]) => {
    for (const v of values) set.add(v);
  };

  const expandedTokens = new Set<string>(tokenize(normalized));

  // Phrase-level intent expansion so common user queries map to our catalog.
  const phraseExpansions: Array<{ test: RegExp; add: string[] }> = [
    { test: /butter\s+chicken/, add: ["butter-chicken", "chicken", "creamy"] },
    { test: /paneer\s+butter\s+masala/, add: ["paneer-butter-masala", "paneer", "creamy"] },
    { test: /caesar/, add: ["salad"] },
    { test: /carbonara/, add: ["pasta", "creamy", "cheese"] },
    { test: /mac\s*(and|&)\s*cheese/, add: ["pasta", "macaroni", "cheese", "creamy", "comfort"] },
    { test: /cheese\s+pizza/, add: ["pizza", "cheese", "party", "comfort"] },
    { test: /cheese\s+pasta/, add: ["pasta", "cheese", "creamy", "comfort"] },
    { test: /cheese\s+dosa/, add: ["dosa", "breakfast", "comfort"] },
    { test: /cheese\s+sandwich/, add: ["sandwich", "toast", "cheese", "quick"] },
    { test: /tuna\s+sandwich/, add: ["seafood", "sandwich", "quick"] },
    { test: /prawn\s+masala/, add: ["seafood", "curry", "masala"] },
    { test: /rogan\s+josh/, add: ["mutton", "curry", "comfort"] },
    { test: /egg\s+curry/, add: ["egg", "curry", "masala"] },
    { test: /egg\s+masala/, add: ["egg", "curry", "masala"] },
    { test: /chicken\s+curry/, add: ["chicken", "curry", "masala"] },
    { test: /chicken\s+masala/, add: ["chicken", "curry", "masala"] },
    { test: /chicken\s+biryani/, add: ["chicken-biryani", "chicken", "biryani", "one-pot"] },
  ];

  for (const rule of phraseExpansions) {
    if (rule.test.test(normalized)) {
      addAll(expandedTokens, rule.add);
    }
  }

  const slug = slugify(normalized);
  if (slug) expandedTokens.add(slug);

  // Token-level expansion for broad coverage.
  const tokenExpansions: Record<string, string[]> = {
    veg: ["vegetarian"],
    vegetarian: ["veg"],
    biryani: ["one-pot", "aromatic", "festive"],
    curry: ["main", "comfort"],
    masala: ["curry", "main", "comfort"],
    dosa: ["breakfast", "street-food"],
    sandwich: ["quick", "snack", "street-food"],
    wrap: ["quick", "snack", "street-food"],
    pizza: ["party", "comfort"],
    pasta: ["comfort", "creamy"],
    cheese: ["creamy", "dairy"],
    paneer: ["cheese", "creamy"],
    tuna: ["seafood"],
    prawn: ["seafood"],
    shrimp: ["seafood"],
    fish: ["seafood"],
    rogan: ["mutton"],
    josh: ["mutton"],
    egg: ["egg-dish"],
  };

  for (const token of Array.from(expandedTokens)) {
    const extras = tokenExpansions[token];
    if (extras) {
      addAll(expandedTokens, extras);
    }
  }

  const tokens = Array.from(expandedTokens);

  const dishText = (dish: DishDetail) =>
    `${dish.name} ${dish.course} ${dish.flavorProfile} ${dish.state} ${dish.region} ${(dish.categories || []).join(" ")} ${(dish.replaces || []).join(" ")} ${dish.heroSummary ?? ""} ${dish.whyItWorks ?? ""}`.toLowerCase();

  const matchesKeyword = (haystack: string, keyword: string) => {
    if (!keyword) return false;
    if (haystack.includes(keyword)) return true;
    // Also match hyphen/space variants.
    const alt = keyword.includes("-") ? keyword.replace(/-/g, " ") : keyword.replace(/\s+/g, "-");
    return alt !== keyword && haystack.includes(alt);
  };

  const seenDishes = new Set<string>();
  const groups: ReplacementGroup[] = [];

  for (const category of REPLACEMENT_CATEGORIES) {
    const matchedKeywords = category.keywords.filter((keyword) =>
      normalized.includes(keyword) || tokens.some((token) => keyword.startsWith(token) || token.startsWith(keyword))
    );

    if (matchedKeywords.length === 0) {
      continue;
    }

    const dishes = DISH_CATALOG.filter((dish) => {
      const haystack = dishText(dish);
      const categoryMatch = (dish.categories || []).some((c) => c.toLowerCase() === category.id.toLowerCase());
      const replacesMatch = (dish.replaces || []).some((item) =>
        matchedKeywords.some((keyword) => matchesKeyword(item.toLowerCase(), keyword))
      );
      const textMatch = matchedKeywords.some((keyword) => matchesKeyword(haystack, keyword));
      return categoryMatch || replacesMatch || textMatch;
    });

    if (dishes.length === 0) {
      continue;
    }

    const uniqueDishes = dishes.filter((dish) => {
      if (seenDishes.has(dish.slug)) {
        return false;
      }
      seenDishes.add(dish.slug);
      return true;
    });

    if (uniqueDishes.length === 0) {
      continue;
    }

    groups.push({
      id: category.id,
      title: category.title,
      keywords: matchedKeywords,
      description: category.description,
      dishes: uniqueDishes,
    });
  }

  if (groups.length > 0) {
    return groups;
  }

  // Broader fallback: token overlap against dish text.
  const fallbackMatches = DISH_CATALOG.map((dish) => {
    const haystack = dishText(dish);
    const score = tokens.reduce((acc, token) => (matchesKeyword(haystack, token) ? acc + 1 : acc), 0);
    return { dish, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.dish.rating ?? 0) - (a.dish.rating ?? 0) || a.dish.name.localeCompare(b.dish.name))
    .slice(0, 18)
    .map((item) => item.dish);

  if (fallbackMatches.length === 0) {
    return [];
  }

  return [
    {
      id: "direct",
      title: "Plant-based matches",
      keywords: [trimmed],
      description: "Closest dishes we could find for your search.",
      dishes: fallbackMatches,
    },
  ];
}