"use client";

import { useState, useMemo } from "react";
import { PreferencesCard } from "../components/PreferencesCard";
import { SearchHero } from "../components/SearchHero";
import { AlternativesGrid, type AltCard } from "../components/AlternativesGrid";
import { DishDetail } from "../components/DishDetail";
import { HeaderNav } from "../components/HeaderNav";
import { useRouter } from "next/navigation";
import { getDishBySlug, findReplacementGroups } from "../../lib/dishes";
import searchSuggestionsData from "../data/searchSuggestions.json";

type View = "preferences" | "search" | "alternatives" | "detail";

export default function PreferencesPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("preferences");
  const [searchValue, setSearchValue] = useState("");
  const [didSearch, setDidSearch] = useState(false);
  const [selectedDishSlug, setSelectedDishSlug] = useState<string | null>(null);

  const suggestions = searchSuggestionsData.searchSuggestions;

  const searchResults = useMemo(() => {
    if (!didSearch) return [];
    const groups = findReplacementGroups(searchValue);
    return groups.map((group) => ({
      id: group.id,
      title: group.title,
      keywords: group.keywords,
      items: group.dishes,
      description: group.description,
    }));
  }, [searchValue, didSearch]);

  const altCards: AltCard[] = useMemo(() => {
    if (searchResults.length === 0) return [];
    const allDishes = searchResults.flatMap((group) => group.items);
    return allDishes.slice(0, 12).map((dish) => ({
      slug: dish.slug,
      name: dish.name,
      badge: dish.diet,
      time: dish.totalTime,
      cost: `₹${dish.priceSwap || dish.estimatedCost || 120}`,
      rating: String(dish.rating || 4.5),
      tags: dish.ingredients.slice(0, 3).map((i) => i.item),
      img: dish.image,
    }));
  }, [searchResults]);

  const selectedDish = selectedDishSlug ? getDishBySlug(selectedDishSlug) : null;

  const handleSearch = (term: string) => {
    setSearchValue(term);
    setDidSearch(true);
    if (term.trim()) {
      setView("alternatives");
    }
  };

  const handleSelectDish = (slug: string) => {
    setSelectedDishSlug(slug);
    setView("detail");
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#f5f9f5] via-[#ecf4ea] to-[#fbfdfc]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 pt-8 sm:px-6">
        <HeaderNav />

        <div className="rounded-[40px] border border-white/50 bg-white/60 p-6 shadow-2xl shadow-[#1c2b1d]/10 backdrop-blur">
          {view === "preferences" && (
            <PreferencesCard
              onBack={() => router.push("/")}
              onNext={() => setView("search")}
              onSkip={() => setView("search")}
            />
          )}

          {view === "search" && (
            <SearchHero
              chips={["Chicken Biryani", "Butter Chicken", "Paneer Tikka", "Fish Curry"]}
              value={searchValue}
              onValueChange={setSearchValue}
              onSubmit={handleSearch}
              suggestions={suggestions}
              onChipSelect={(chip) => {
                setSearchValue(chip);
                handleSearch(chip);
              }}
              onBack={() => setView("preferences")}
              results={searchResults}
              didSearch={didSearch}
              onSelectResult={(dish) => handleSelectDish(dish.slug)}
            />
          )}
        </div>

        {view === "alternatives" && (
          <section className="rounded-[36px] border border-[#d6e7db] bg-gradient-to-br from-white to-[#f4faf2] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1b2e24]">Alternatives curated for you</h2>
              <button
                className="text-sm font-semibold text-[#2f6b4a] transition hover:text-[#1b412d]"
                onClick={() => setView("search")}
              >
                Refine search
              </button>
            </div>
            <AlternativesGrid
              cards={altCards}
              onSelect={handleSelectDish}
              onBack={() => setView("search")}
              onFilterClick={(label) => console.log("Filter:", label)}
            />
          </section>
        )}

        {view === "detail" && selectedDish && (
          <section className="rounded-[36px] border border-[#d6e7db] bg-white p-6 shadow-xl">
            <DishDetail
              dish={selectedDish}
              onBack={() => setView("alternatives")}
              onCook={() => console.log("Cook", selectedDish.name)}
            />
          </section>
        )}
      </div>
    </div>
  );
}
