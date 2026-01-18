export type DishDetail = {
  slug: string;
  name: string;
  diet: "vegan" | "vegetarian";
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
  calories?: string;
  protein?: string;
  fiber?: string;
  priceOriginal?: string;
  priceSwap?: string;
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

export const DISH_CATALOG: DishDetail[] = [
  {
    slug: "tempeh-coastal-curry",
    name: "Tempeh Coastal Curry",
    diet: "vegan",
    course: "Main course",
    flavorProfile: "Coastal",
    state: "Kerala",
    region: "South India",
    replaces: ["Fish Curry", "Prawn Curry", "Mutton Curry"],
    ingredients: [
      { item: "Tempeh cubes", quantity: "200 g" },
      { item: "Coconut milk", quantity: "1.5 cups" },
      { item: "Tamarind pulp", quantity: "2 tbsp" },
      { item: "Curry leaves", quantity: "1 sprig" },
    ],
    prepTime: "15 minutes",
    cookTime: "25 minutes",
    totalTime: "40 minutes",
    steps: [
      { step: 1, instruction: "Toast tempeh with spice rub.", time: "6 minutes" },
      { step: 2, instruction: "Simmer coconut base with aromatics.", time: "12 minutes" },
      { step: 3, instruction: "Finish with tamarind and curry leaves.", time: "7 minutes" },
    ],
    chefTips: ["Steep kokum for tang", "Add toasted coconut at the end"],
    whyItWorks: "Tempeh soaks up coastal gravies while adding protein.",
    image: "/assets/tempeh-coastal-curry.svg",
    videoId: "ti39xAXOsbU",
    categories: ["seafood", "mutton"],
    rating: 4.8,
    reviews: 710,
    trendingCity: "Kochi",
    heroSummary: "Coconut-tempeh curry with tamarind snap and coastal aromatics for a seafood-free fix.",
    calories: "350",
    protein: "20g",
    fiber: "6g",
    priceOriginal: "₹230",
    priceSwap: "₹150",
  },
  {
    slug: "chickpea-spinach-curry",
    name: "Chickpea & Spinach Curry",
    diet: "vegetarian",
    course: "Main course",
    flavorProfile: "Savory",
    state: "Pan India",
    region: "Pan India",
    replaces: ["Chicken Saag", "Mutton Saag", "Spinach Chicken", "Chicken Palak"],
    ingredients: [
      { item: "Boiled chickpeas", quantity: "1.5 cups" },
      { item: "Spinach (pureed)", quantity: "2 cups" },
      { item: "Onion (chopped)", quantity: "1 medium" },
      { item: "Garlic", quantity: "1 tbsp" },
      { item: "Oil", quantity: "2 tbsp" },
    ],
    prepTime: "15 minutes",
    cookTime: "30 minutes",
    totalTime: "45 minutes",
    steps: [
      { step: 1, instruction: "Sauté garlic and onion until aromatic.", time: "6 minutes" },
      { step: 2, instruction: "Add spinach puree and cook to remove raw taste.", time: "8 minutes" },
      { step: 3, instruction: "Add chickpeas and simmer gently.", time: "12 minutes" },
      { step: 4, instruction: "Rest curry to deepen flavor.", time: "4 minutes (resting)" },
    ],
    chefTips: ["Do not overcook spinach", "Slow simmer enhances richness"],
    whyItWorks: "Protein plus greens replicate hearty meat-saag combinations.",
    image: "/assets/Chickpea%20%26%20Spinach%20Curry.jpeg",
    videoId: "x0GD4AdFO-s",
    categories: ["chicken", "mutton"],
  },
  {
    slug: "vegetable-kofta-curry",
    name: "Vegetable Kofta Curry",
    diet: "vegetarian",
    course: "Main course",
    flavorProfile: "Spicy",
    state: "Uttar Pradesh",
    region: "North India",
    replaces: ["Meat Kofta", "Chicken Kofta", "Mutton Balls", "Meatball Curry"],
    ingredients: [
      { item: "Mixed vegetables (grated)", quantity: "2 cups" },
      { item: "Besan", quantity: "1/2 cup" },
      { item: "Onion-tomato gravy", quantity: "2 cups" },
      { item: "Oil", quantity: "For frying" },
      { item: "Spices", quantity: "To taste" },
    ],
    prepTime: "25 minutes",
    cookTime: "35 minutes",
    totalTime: "60 minutes",
    steps: [
      { step: 1, instruction: "Mix grated vegetables with besan and spices.", time: "5 minutes" },
      { step: 2, instruction: "Shape into round balls and deep fry until golden.", time: "10 minutes" },
      { step: 3, instruction: "Prepare onion-tomato gravy separately.", time: "15 minutes" },
      { step: 4, instruction: "Add koftas to gravy just before serving.", time: "5 minutes" },
    ],
    chefTips: ["Add koftas last to prevent sogginess", "Squeeze excess moisture from veggies"],
    whyItWorks: "Shape, bite, and gravy closely replicate meat kofta dishes.",
    image: "/assets/Vegetable%20Kofta%20Curry.jpeg",
    videoId: "Aumq08gMgDU",
    categories: ["mutton", "chicken"],
  },
  {
    slug: "lentil-cutlets",
    name: "Lentil Cutlets",
    diet: "vegetarian",
    course: "Starter",
    flavorProfile: "Savory",
    state: "Pan India",
    region: "Pan India",
    replaces: ["Chicken Cutlet", "Meat Patties", "Fish Fingers", "Chicken Nuggets"],
    ingredients: [
      { item: "Mixed lentils (boiled & mashed)", quantity: "1.5 cups" },
      { item: "Onion (finely chopped)", quantity: "1 small" },
      { item: "Bread crumbs", quantity: "1/2 cup" },
      { item: "Garam masala", quantity: "1 tsp" },
      { item: "Oil", quantity: "For shallow frying" },
      { item: "Salt", quantity: "To taste" },
    ],
    prepTime: "20 minutes",
    cookTime: "20 minutes",
    totalTime: "40 minutes",
    steps: [
      { step: 1, instruction: "Combine mashed lentils with onion, spices, and breadcrumbs.", time: "5 minutes" },
      { step: 2, instruction: "Shape mixture into flat patties.", time: "5 minutes" },
      { step: 3, instruction: "Rest patties to firm up before frying.", time: "5 minutes (resting)" },
      { step: 4, instruction: "Shallow fry on medium flame until golden on both sides.", time: "10 minutes" },
    ],
    chefTips: ["Resting prevents cutlets from breaking", "Medium flame ensures crisp outside"],
    whyItWorks: "Crunchy exterior and protein-rich interior mimic meat snacks.",
    image: "/assets/Lentil%20Cutlets.jpeg",
    videoId: "RhHGylq7hw4",
    categories: ["chicken", "seafood", "mutton"],
  },
  {
    slug: "mushroom-biryani",
    name: "Mushroom Biryani",
    diet: "vegetarian",
    course: "Main course",
    flavorProfile: "Spicy",
    state: "Karnataka",
    region: "South India",
    replaces: ["Chicken Biryani", "Egg Biryani", "Prawn Biryani", "Keema Rice"],
    ingredients: [
      { item: "Button mushrooms (halved)", quantity: "250 g" },
      { item: "Basmati rice", quantity: "1.5 cups" },
      { item: "Onion (sliced)", quantity: "2 medium" },
      { item: "Tomato (chopped)", quantity: "1 large" },
      { item: "Ginger-garlic paste", quantity: "1 tbsp" },
      { item: "Biryani masala", quantity: "2 tbsp" },
      { item: "Oil", quantity: "3 tbsp" },
      { item: "Salt", quantity: "To taste" },
    ],
    prepTime: "20 minutes",
    cookTime: "30 minutes",
    totalTime: "50 minutes",
    steps: [
      { step: 1, instruction: "Wash and soak basmati rice to ensure long grains.", time: "20 minutes (soaking)" },
      { step: 2, instruction: "Heat oil and sauté onions until golden brown.", time: "8 minutes" },
      { step: 3, instruction: "Add ginger-garlic paste and cook till fragrant.", time: "2 minutes" },
      { step: 4, instruction: "Add tomatoes and biryani masala. Cook until oil releases.", time: "6 minutes" },
      { step: 5, instruction: "Add mushrooms and cook uncovered so excess moisture evaporates.", time: "5 minutes" },
      { step: 6, instruction: "Add rice, water, and salt. Cook covered on low flame.", time: "12 minutes" },
      { step: 7, instruction: "Rest biryani before fluffing and serving.", time: "4 minutes (resting)" },
    ],
    chefTips: ["Never overcook mushrooms", "Resting is key for aroma"],
    whyItWorks: "Mushrooms provide deep umami flavor that replaces meat richness in biryani.",
    image: "/assets/Mushroom%20Biryani.jpeg",
    videoId: "e-k8xAT4GsE",
    categories: ["chicken", "mutton", "seafood"],
  },
  {
    slug: "paneer-bhurji",
    name: "Paneer Bhurji",
    diet: "vegetarian",
    course: "Main course",
    flavorProfile: "Spicy",
    state: "North India",
    region: "North India",
    replaces: ["Egg Bhurji", "Scrambled Eggs", "Egg Curry", "Egg Toast"],
    ingredients: [
      { item: "Paneer (crumbled)", quantity: "250 g" },
      { item: "Onion (chopped)", quantity: "1 medium" },
      { item: "Tomato (chopped)", quantity: "1 medium" },
      { item: "Green chilli", quantity: "1 (chopped)" },
      { item: "Turmeric powder", quantity: "1/2 tsp" },
      { item: "Oil", quantity: "1.5 tbsp" },
    ],
    prepTime: "10 minutes",
    cookTime: "15 minutes",
    totalTime: "25 minutes",
    steps: [
      { step: 1, instruction: "Heat oil and sauté onions until translucent.", time: "4 minutes" },
      { step: 2, instruction: "Add tomatoes and cook till soft.", time: "4 minutes" },
      { step: 3, instruction: "Add spices and green chilli.", time: "2 minutes" },
      { step: 4, instruction: "Add crumbled paneer and mix gently.", time: "3 minutes" },
      { step: 5, instruction: "Rest briefly before serving with toast or roti.", time: "2 minutes (resting)" },
    ],
    chefTips: ["Do not overcook paneer", "Crush paneer by hand for egg-like texture"],
    whyItWorks: "Scrambled paneer closely matches egg bhurji texture and protein.",
    image: "/assets/Paneer%20Bhurji.jpeg",
    videoId: "MQ0CpWYYl7s",
    categories: ["egg", "chicken"],
  },
  {
    slug: "rajma-masala",
    name: "Rajma Masala",
    diet: "vegetarian",
    course: "Main course",
    flavorProfile: "Spicy",
    state: "Punjab",
    region: "North India",
    replaces: ["Chicken Masala", "Mutton Curry", "Beef Curry", "Meat Gravies"],
    ingredients: [
      { item: "Rajma (kidney beans)", quantity: "1 cup" },
      { item: "Onion (pureed)", quantity: "1 cup" },
      { item: "Tomato puree", quantity: "1 cup" },
      { item: "Ginger-garlic paste", quantity: "1 tbsp" },
      { item: "Rajma masala", quantity: "1 tbsp" },
      { item: "Oil", quantity: "2 tbsp" },
    ],
    prepTime: "15 minutes",
    cookTime: "45 minutes",
    totalTime: "60 minutes",
    steps: [
      { step: 1, instruction: "Soak rajma overnight for better digestion.", time: "8 hours (soaking)" },
      { step: 2, instruction: "Pressure cook rajma until soft.", time: "20 minutes" },
      { step: 3, instruction: "Cook onion and ginger-garlic paste until golden.", time: "7 minutes" },
      { step: 4, instruction: "Add tomato puree and spices; cook till oil separates.", time: "8 minutes" },
      { step: 5, instruction: "Add rajma and simmer slowly.", time: "10 minutes" },
      { step: 6, instruction: "Rest curry before serving.", time: "5 minutes (resting)" },
    ],
    chefTips: ["Slow simmering improves meat-like depth", "Mash a few beans to thicken gravy"],
    whyItWorks: "Protein-rich beans give heaviness similar to meat curries.",
    image: "/assets/Rajma%20Masala.jpeg",
    videoId: "CFwSTTiLJyw",
    categories: ["mutton", "chicken"],
  },
  {
    slug: "banana-blossom-fry",
    name: "Banana Blossom Fry",
    diet: "vegetarian",
    course: "Side dish",
    flavorProfile: "Savory",
    state: "Tamil Nadu",
    region: "South India",
    replaces: ["Fish Fry", "Prawn Fry", "Fish Cutlet", "Fish Roast"],
    ingredients: [
      { item: "Banana blossom (cleaned & chopped)", quantity: "2 cups" },
      { item: "Onion (sliced)", quantity: "1 medium" },
      { item: "Turmeric powder", quantity: "1/2 tsp" },
      { item: "Chilli powder", quantity: "1 tsp" },
      { item: "Oil", quantity: "2 tbsp" },
      { item: "Salt", quantity: "To taste" },
    ],
    prepTime: "30 minutes",
    cookTime: "25 minutes",
    totalTime: "55 minutes",
    steps: [
      { step: 1, instruction: "Soak chopped banana blossom in buttermilk to remove bitterness.", time: "20 minutes (soaking)" },
      { step: 2, instruction: "Boil with turmeric and salt until tender.", time: "10 minutes" },
      { step: 3, instruction: "Heat oil and sauté onions till soft.", time: "5 minutes" },
      { step: 4, instruction: "Add banana blossom and spices, stir-fry on high heat.", time: "7 minutes" },
      { step: 5, instruction: "Let rest briefly before serving.", time: "3 minutes (resting)" },
    ],
    chefTips: ["High heat gives fish-fry like texture", "Do not overboil blossom"],
    whyItWorks: "Flaky texture and crisp exterior resemble fried fish.",
    image: "/assets/Soya%20Keema.jpeg",
    videoId: "RyjDn_vUbv8",
    categories: ["seafood"],
  },
  {
    slug: "tofu-butter-masala",
    name: "Tofu Butter Masala",
    diet: "vegetarian",
    course: "Main course",
    flavorProfile: "Creamy",
    state: "Delhi",
    region: "North India",
    replaces: ["Butter Chicken", "Chicken Korma", "Malai Chicken", "Chicken Handi"],
    ingredients: [
      { item: "Firm tofu (cubed)", quantity: "250 g" },
      { item: "Tomato puree", quantity: "1.5 cups" },
      { item: "Butter", quantity: "2 tbsp" },
      { item: "Fresh cream", quantity: "3 tbsp" },
      { item: "Ginger-garlic paste", quantity: "1 tbsp" },
      { item: "Kashmiri chilli powder", quantity: "1 tsp" },
      { item: "Garam masala", quantity: "1 tsp" },
      { item: "Salt", quantity: "To taste" },
    ],
    prepTime: "15 minutes",
    cookTime: "25 minutes",
    totalTime: "40 minutes",
    steps: [
      { step: 1, instruction: "Soak tofu cubes in warm salted water to soften texture.", time: "10 minutes (soaking)" },
      { step: 2, instruction: "Heat butter and sauté ginger-garlic paste until aromatic.", time: "2 minutes" },
      { step: 3, instruction: "Add tomato puree and spices. Cook until thick and glossy.", time: "10 minutes" },
      { step: 4, instruction: "Add tofu cubes gently and simmer in gravy.", time: "7 minutes" },
      { step: 5, instruction: "Stir in cream and garam masala, then rest.", time: "3 minutes" },
      { step: 6, instruction: "Let curry rest covered for flavour absorption.", time: "3 minutes (resting)" },
    ],
    chefTips: ["Soaking tofu removes raw soy taste", "Use low flame after adding cream"],
    whyItWorks: "Rich buttery gravy and soft protein cubes closely match butter chicken experience.",
    image: "/assets/Tofu%20Butter%20Masala.jpeg",
    videoId: "VDAYbu-lhEw",
    categories: ["chicken", "mutton"],
  },
  {
    slug: "soya-chunk-biryani",
    name: "Soya Chunk Biryani",
    diet: "vegetarian",
    course: "Main course",
    flavorProfile: "Spicy",
    state: "Telangana",
    region: "South India",
    replaces: ["Chicken Biryani", "Mutton Biryani", "Egg Biryani", "Keema Rice"],
    ingredients: [
      { item: "Soya chunks", quantity: "1 cup" },
      { item: "Basmati rice", quantity: "1.5 cups" },
      { item: "Onion (sliced)", quantity: "2 medium" },
      { item: "Tomato (chopped)", quantity: "1 large" },
      { item: "Ginger-garlic paste", quantity: "1 tbsp" },
      { item: "Biryani masala", quantity: "2 tbsp" },
      { item: "Green chilli", quantity: "2 (slit)" },
      { item: "Oil", quantity: "3 tbsp" },
      { item: "Salt", quantity: "To taste" },
      { item: "Water", quantity: "3 cups" },
    ],
    prepTime: "20 minutes",
    cookTime: "35 minutes",
    totalTime: "55 minutes",
    steps: [
      { step: 1, instruction: "Boil soya chunks in salted water, then rinse and squeeze.", time: "5 minutes" },
      { step: 2, instruction: "Soak basmati rice for fluffy grains.", time: "20 minutes (soaking)" },
      { step: 3, instruction: "Sauté onions until golden brown.", time: "8 minutes" },
      { step: 4, instruction: "Add ginger-garlic paste and green chillies.", time: "2 minutes" },
      { step: 5, instruction: "Cook tomatoes and biryani masala until oil separates.", time: "6 minutes" },
      { step: 6, instruction: "Add soya chunks to absorb the masala.", time: "3 minutes" },
      { step: 7, instruction: "Add rice, salt, and water. Cover and cook on low flame.", time: "12 minutes" },
      { step: 8, instruction: "Rest biryani before serving.", time: "5 minutes (resting)" },
    ],
    chefTips: ["Squeeze soya chunks well", "Resting enhances aroma", "Top with mint leaves"],
    whyItWorks: "Soya chunks provide a chewy texture similar to meat while preserving the classic biryani spice profile.",
    image: "/assets/Soya%20Chunk%20Biryani.jpeg",
    videoId: "VrE09piPIj0",
    categories: ["chicken", "mutton"],
  },
  {
    slug: "jackfruit-curry",
    name: "Jackfruit Curry",
    diet: "vegetarian",
    course: "Main course",
    flavorProfile: "Spicy",
    state: "Kerala",
    region: "South India",
    replaces: ["Mutton Curry", "Beef Curry", "Chicken Curry", "Lamb Stew"],
    ingredients: [
      { item: "Raw jackfruit (boiled & shredded)", quantity: "2 cups" },
      { item: "Onion (chopped)", quantity: "2 medium" },
      { item: "Tomato (pureed)", quantity: "1 cup" },
      { item: "Ginger-garlic paste", quantity: "1 tbsp" },
      { item: "Coconut oil", quantity: "2 tbsp" },
      { item: "Garam masala", quantity: "1.5 tbsp" },
      { item: "Salt", quantity: "To taste" },
    ],
    prepTime: "25 minutes",
    cookTime: "40 minutes",
    totalTime: "65 minutes",
    steps: [
      { step: 1, instruction: "Pressure cook jackfruit until tender, then shred.", time: "15 minutes" },
      { step: 2, instruction: "Sauté onions in coconut oil until translucent.", time: "6 minutes" },
      { step: 3, instruction: "Add ginger-garlic paste and cook till aromatic.", time: "2 minutes" },
      { step: 4, instruction: "Add tomato puree and spices. Cook till oil separates.", time: "8 minutes" },
      { step: 5, instruction: "Fold in shredded jackfruit and coat with masala.", time: "5 minutes" },
      { step: 6, instruction: "Add water and simmer to absorb flavours.", time: "10 minutes" },
      { step: 7, instruction: "Rest before serving.", time: "4 minutes (resting)" },
    ],
    chefTips: ["Use young jackfruit for best texture", "Avoid over-stirring to retain fibres"],
    whyItWorks: "Jackfruit’s fibres closely mimic slow-cooked meat curries.",
    image: "/assets/Jackfruit%20Curry.jpeg",
    videoId: "tNR_qUsij5c",
    categories: ["mutton", "chicken"],
  },
  {
    slug: "mushroom-pepper-fry",
    name: "Mushroom Pepper Fry",
    diet: "vegetarian",
    course: "Main course",
    flavorProfile: "Spicy",
    state: "Tamil Nadu",
    region: "South India",
    replaces: ["Chicken Pepper Fry", "Beef Pepper Fry", "Fish Fry", "Prawn Fry"],
    ingredients: [
      { item: "Button mushrooms (sliced)", quantity: "250 g" },
      { item: "Crushed black pepper", quantity: "1.5 tbsp" },
      { item: "Onion (sliced)", quantity: "1 large" },
      { item: "Garlic (chopped)", quantity: "1 tbsp" },
      { item: "Curry leaves", quantity: "1 sprig" },
      { item: "Oil", quantity: "2 tbsp" },
      { item: "Salt", quantity: "To taste" },
    ],
    prepTime: "15 minutes",
    cookTime: "20 minutes",
    totalTime: "35 minutes",
    steps: [
      { step: 1, instruction: "Heat oil and splutter curry leaves.", time: "1 minute" },
      { step: 2, instruction: "Add garlic and sauté till lightly golden.", time: "2 minutes" },
      { step: 3, instruction: "Add onions and cook until soft.", time: "5 minutes" },
      { step: 4, instruction: "Add mushrooms and cook uncovered.", time: "6 minutes" },
      { step: 5, instruction: "Add crushed pepper and salt. Toss well.", time: "4 minutes" },
      { step: 6, instruction: "Rest before serving for flavour absorption.", time: "2 minutes (resting)" },
    ],
    chefTips: ["Cook mushrooms uncovered", "Use freshly crushed pepper"],
    whyItWorks: "Mushrooms deliver deep umami and bite similar to meat fries.",
    image: "/assets/Mushroom%20Pepper%20Fry.jpeg",
    videoId: "6WffihqH6Pk",
    categories: ["chicken", "seafood", "mutton"],
  },
  {
    slug: "paneer-tikka",
    name: "Paneer Tikka",
    diet: "vegetarian",
    course: "Starter",
    flavorProfile: "Spicy",
    state: "Punjab",
    region: "North India",
    replaces: ["Chicken Tikka", "Tandoori Chicken", "Chicken Kebab", "Malai Chicken"],
    ingredients: [
      { item: "Paneer cubes", quantity: "250 g" },
      { item: "Thick curd", quantity: "1 cup" },
      { item: "Ginger-garlic paste", quantity: "1 tbsp" },
      { item: "Red chilli powder", quantity: "1 tsp" },
      { item: "Garam masala", quantity: "1 tsp" },
      { item: "Oil", quantity: "1 tbsp" },
    ],
    prepTime: "20 minutes",
    cookTime: "25 minutes",
    totalTime: "45 minutes",
    steps: [
      { step: 1, instruction: "Mix curd with spices and oil to form marinade.", time: "3 minutes" },
      { step: 2, instruction: "Add paneer cubes and coat evenly.", time: "2 minutes" },
      { step: 3, instruction: "Marinate paneer to absorb flavours.", time: "20 minutes (marination)" },
      { step: 4, instruction: "Grill or pan-roast paneer until charred edges appear.", time: "10 minutes" },
      { step: 5, instruction: "Rest before serving to retain moisture.", time: "2 minutes (resting)" },
    ],
    chefTips: ["Use thick curd to avoid watery marinade", "Do not overcook paneer"],
    whyItWorks: "Paneer provides protein and grilled texture similar to kebabs.",
    image: "/assets/Paneer%20Tikka.jpeg",
    videoId: "Icig48ZyuJc",
    categories: ["chicken"],
  },
];

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