"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import { useSearchParams } from "next/navigation";
import { findReplacementGroups, DISH_CATALOG, type DishDetail as DishDetailType } from "../../lib/dishes";
import { DishDetail } from "../components/DishDetail";

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

export default function SwapPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDish, setSelectedDish] = useState<DishDetailType | null>(null);
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

  const cuisineOptions = ["Tamil", "Telugu", "Kerala", "Hyderabadi", "Punjabi", "Gujarati"];
  const allergyOptions = ["Peanuts", "Tree Nuts", "Soy", "Milk", "Eggs", "Sesame"];
  const tasteOptions = ["Spicy", "Savory", "Umami", "Sweet", "Tangy"];

  // Search suggestions from static dishes for autocomplete
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.trim().toLowerCase();
    // Also include common non-veg keywords for swap suggestions
    const nonVegKeywords = ["chicken", "mutton", "fish", "prawn", "egg", "beef", "lamb", "biryani", "kebab", "tikka"];
    const matchingNonVeg = nonVegKeywords.filter((kw) => kw.includes(lower) || lower.includes(kw));
    const dishNames = dishes.map((d) => d.name).filter((name) => name.toLowerCase().includes(lower));
    return [...new Set([...matchingNonVeg, ...dishNames])].slice(0, 6);
  }, [query]);

  // Use the swap engine to find plant-based alternatives
  const swapResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return findReplacementGroups(searchTerm);
  }, [searchTerm]);

  const hasSwapResults = swapResults.length > 0;

  // Handle search submission
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Handle dish selection
  const handleSelectDish = (dish: DishDetailType) => {
    setSelectedDish(dish);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle back from dish detail
  const handleBackFromDetail = () => {
    setSelectedDish(null);
  };

  // Map catalog dishes to card format for recommended section
  const recommended = useMemo(() => DISH_CATALOG.slice(0, 6).map((d) => ({
    id: d.slug,
    name: d.name,
    image: d.image,
    rating: d.rating ?? 4.8,
    reviewCount: d.reviews ?? 500,
    restaurant: d.region,
    category: d.course,
    detail: d,
  })), []);

  const filteredTopPicks = useMemo(() => {
    if (!query.trim()) return dishes.slice(0, 8);
    return dishes.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8);
  }, [query]);

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
      <main className={`${jakarta.className} ${impact.variable} min-h-screen bg-highlight text-slate-900`}>
        <nav className="sticky top-0 z-50 border-b-3 border-black bg-highlight/90 backdrop-blur-sm">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
            <div className="group flex items-center gap-2">
              <img
                src="/c4c.webp"
                alt="OffRamp logo"
                className="h-10 w-10 rounded border-2 border-black bg-white object-cover transition-transform duration-300 group-hover:rotate-6"
              />
              <span className="font-impact text-3xl uppercase tracking-wide text-black">OffRamp</span>
            </div>
            <button
              onClick={handleBackFromDetail}
              className="flex items-center gap-2 rounded-full border-2 border-black bg-white px-6 py-2 text-sm font-bold uppercase transition hover:bg-black hover:text-white"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Search
            </button>
          </div>
        </nav>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <DishDetail dish={selectedDish} onBack={handleBackFromDetail} />
        </div>
      </main>
    );
  }

  return (
    <main className={`${jakarta.className} ${impact.variable} min-h-screen bg-highlight text-slate-900`}>
      <nav className="sticky top-0 z-50 border-b-3 border-black bg-highlight/90 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="group flex items-center gap-2">
            <img
              src="/c4c.webp"
              alt="OffRamp logo"
              className="h-10 w-10 rounded border-2 border-black bg-white object-cover transition-transform duration-300 group-hover:rotate-6"
            />
            <span className="font-impact text-3xl uppercase tracking-wide text-black">OffRamp</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-bold uppercase tracking-wider md:flex">
            <Link href="/#how-it-works" className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              How it Works
            </Link>
            <Link href="/#features" className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              Features
            </Link>
            <Link href="/#impact" className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              Impact
            </Link>
            <Link href="/#institutions" className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              Institutions
            </Link>
            {isDemo && (
              <Link href="#preferences" className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
                Preferences
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isDemo ? (
              <div className="hidden items-center gap-2 rounded-full border-2 border-black bg-white px-6 py-2 text-sm font-black uppercase text-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:flex">
                <span className="material-symbols-outlined text-base text-primary">verified</span>
                Demo
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden transform items-center gap-2 rounded-full border-2 border-black px-8 py-2 text-sm font-bold uppercase transition-all duration-300 hover:scale-105 hover:bg-black hover:text-white sm:flex"
              >
                <span className="material-symbols-outlined text-base">login</span>
                Log In
              </Link>
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
            <div className="flex flex-wrap gap-3">
              <Link
                href="#search"
                className="rounded-2xl border-2 border-black bg-black px-10 py-4 text-lg font-black uppercase text-white transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-accent hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
              >
                Start Your Swap
              </Link>
              <Link
                href="/#how-it-works"
                className="rounded-2xl border-2 border-black bg-white px-8 py-4 text-lg font-black uppercase text-black transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
              >
                How it Works
              </Link>
            </div>
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
              className="flex items-center gap-3 rounded-2xl border-3 border-black bg-white px-5 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="material-symbols-outlined text-xl text-slate-500">search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your favorite dish (e.g., Chicken Biryani, Mutton Curry)"
                className="w-full bg-transparent text-base font-semibold text-black placeholder:text-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSearchTerm("");
                  }}
                  className="text-slate-500 transition hover:text-black"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              <button
                type="submit"
                className="rounded-xl border-2 border-black bg-black px-4 py-2 text-sm font-bold uppercase text-white transition hover:bg-accent"
              >
                Find Swaps
              </button>
            </form>
            {suggestions.length > 0 && !searchTerm && (
              <div className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border-3 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <ul className="divide-y divide-black/10">
                  {suggestions.map((sugg) => (
                    <li key={sugg}>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery(sugg);
                          handleSearch(sugg);
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-highlight"
                      >
                        {sugg}
                        <span className="material-symbols-outlined text-base text-slate-500">north_east</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Swap Results Section */}
      {hasSwapResults && (
        <section id="swap-results" className="px-6 pb-12">
          <div className="mx-auto max-w-6xl space-y-6">
            {swapResults.map((group) => (
              <div key={group.id} className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-white">
                        Plant-based alternative for "{searchTerm}"
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

      {/* No Results Message */}
      {searchTerm && !hasSwapResults && (
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
              <p className="font-impact text-4xl uppercase text-black">Most Recommended</p>
              <p className="text-sm font-semibold text-slate-600">Based on popular preferences—no login required.</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Your plate, your rules</span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((dish) => (
              <RecommendedCard key={dish.id} dish={dish} onSelect={() => handleSelectDish(dish.detail)} />
            ))}
          </div>
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
          <div className="group flex items-center gap-2">
            <img
              src="/c4c.webp"
              alt="OffRamp logo"
              className="h-10 w-10 rounded border-2 border-black bg-white object-cover transition-transform duration-300 group-hover:rotate-6"
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
            © 2024 C4C OFFRAMP. BE BOLD. EAT WELL.
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShowCode(true)}
            className="rounded-full border-2 border-black bg-highlight px-5 py-2 text-xs font-black uppercase text-black transition hover:-translate-y-1 hover:bg-accent hover:text-white"
          >
            View QR Code
          </button>
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
  return (
    <div className="group relative w-72 shrink-0 cursor-pointer snap-start overflow-hidden rounded-3xl border-3 border-black bg-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition duration-300 hover:-translate-y-2 hover:shadow-[14px_14px_0px_0px_rgba(0,0,0,1)]">
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={dish.image}
          alt={dish.name}
          fill
          sizes="288px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition duration-300" />
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black shadow">⭐ {dish.rating.toFixed(2)}</div>
      </div>
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 py-4 text-white transition duration-300">
        <p className="font-impact text-2xl tracking-wide">{dish.name}</p>
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-white/80">
          <span>{dish.restaurant}</span>
          <span>{dish.category}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-white/90">
          <span className="rounded-full bg-white/15 px-2 py-1">⭐ {dish.rating.toFixed(1)}</span>
          <span className="text-white/70">{dish.reviewCount.toLocaleString()} reviews</span>
        </div>
      </div>
    </div>
  );
}

type RecommendedCardDish = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  restaurant: string;
  category: string;
  detail: DishDetailType;
};

function RecommendedCard({ dish, onSelect }: { dish: RecommendedCardDish; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-3xl border-3 border-black bg-white text-left shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition duration-300 hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="relative h-48 w-full overflow-hidden bg-black">
        <Image
          src={dish.image}
          alt={dish.name}
          fill
          sizes="320px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-bold uppercase text-white">{dish.category}</div>
        <div className="absolute right-3 top-3 rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase text-white">
          🌿 Plant-based
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between px-4 py-4 text-slate-900">
        <div className="space-y-2">
          <p className="font-impact text-2xl uppercase text-black">{dish.name}</p>
          <p className="text-sm font-semibold text-slate-600">{dish.restaurant}</p>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm font-bold text-slate-700">
          <span className="flex items-center gap-1 rounded-full bg-highlight px-3 py-1">⭐ {dish.rating.toFixed(1)}</span>
          <span className="text-slate-500">{dish.reviewCount.toLocaleString()} reviews</span>
        </div>
      </div>
    </button>
  );
}

// Swap result card for search results
function SwapResultCard({ dish, onSelect }: { dish: DishDetailType; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-3xl border-3 border-black bg-white text-left shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition duration-300 hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="relative h-48 w-full overflow-hidden bg-black">
        <Image
          src={dish.image}
          alt={dish.name}
          fill
          sizes="320px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-white">
          🌿 Plant-based swap
        </div>
        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-black shadow">
          💧 Water saved · 🌍 CO₂ reduced
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between px-4 py-4 text-slate-900">
        <div className="space-y-2">
          <p className="font-impact text-2xl uppercase text-black">{dish.name}</p>
          <p className="text-sm font-semibold text-slate-600">{dish.region} · {dish.course}</p>
          <p className="text-xs text-slate-500">
            Replaces: {dish.replaces.slice(0, 2).join(", ")}{dish.replaces.length > 2 ? "..." : ""}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm font-bold text-slate-700">
          <span className="flex items-center gap-1 rounded-full bg-highlight px-3 py-1">⭐ {(dish.rating ?? 4.8).toFixed(1)}</span>
          <span className="rounded-full border-2 border-primary bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            View Recipe →
          </span>
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
