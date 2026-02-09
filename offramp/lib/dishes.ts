import mockData from "../Mock.json";

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
  const tokens = Array.from(new Set(normalized.split(/[^a-z0-9]+/g).filter(Boolean)));

  const seenDishes = new Set<string>();
  const groups: ReplacementGroup[] = [];

  for (const category of REPLACEMENT_CATEGORIES) {
    const matchedKeywords = category.keywords.filter((keyword) =>
      normalized.includes(keyword) || tokens.some((token) => keyword.startsWith(token) || token.startsWith(keyword))
    );

    if (matchedKeywords.length === 0) {
      continue;
    }

    const dishes = DISH_CATALOG.filter((dish) =>
      dish.categories.includes(category.id) ||
      dish.replaces.some((item) => matchedKeywords.some((keyword) => item.toLowerCase().includes(keyword)))
    );

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

  const fallbackMatches = DISH_CATALOG.filter((dish) => {
    const nameMatch = dish.name.toLowerCase().includes(normalized);
    const replaceMatch = dish.replaces.some((item) => item.toLowerCase().includes(normalized));
    return nameMatch || replaceMatch;
  });

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