"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

import type { DishDetail } from "../../lib/dishes";
import { SearchChips } from "./search-hero/SearchChips";
import { SearchFooter } from "./search-hero/SearchFooter";
import { SearchInput } from "./search-hero/SearchInput";
import { SearchResults } from "./search-hero/SearchResults";
import type { FooterOption, ResultGroup } from "./search-hero/types";

export type SearchHeroProps = {
  chips: string[];
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (term: string) => void;
  suggestions?: string[];
  onChipSelect?: (chip: string) => void;
  onBack?: () => void;
  results: ResultGroup[];
  didSearch?: boolean;
  onSelectResult?: (dish: DishDetail) => void;
};

export function SearchHero({
  chips,
  value,
  onValueChange,
  onSubmit,
  suggestions = [],
  onChipSelect,
  onBack,
  results,
  didSearch,
  onSelectResult,
}: SearchHeroProps) {
  const filteredSuggestions = useMemo(() => {
    if (!value.trim()) return [];
    const lower = value.toLowerCase();
    return suggestions.filter((item) => item.toLowerCase().includes(lower)).slice(0, 6);
  }, [value, suggestions]);

  const handleSuggestionSelect = (next: string) => {
    onValueChange(next);
    onSubmit(next.trim());
  };

  const footerOptions: FooterOption[] = [
    { label: "Categories", icon: "➕" },
    { label: "Map View", icon: "🗺️" },
    { label: "Saved", icon: "🤍" },
  ];

  const triggerSubmit = () => onSubmit(value.trim());

  return (
    <motion.section
      className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#fef9f4] via-[#eff8f1] to-[#ddecf1] p-6 shadow-2xl shadow-[#0f2716]/30 ring-1 ring-[#132e1f]/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(44,122,70,0.25),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.6),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(255,255,255,0.5),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(19,45,30,0.25),transparent_30%)]" />
      <div className="relative flex flex-col items-center gap-6 text-center">
        <motion.button
          className="absolute left-0 top-0 rounded-full border border-white/70 bg-white/50 px-3 py-2 text-sm font-semibold text-[#1c3a2b] shadow-sm backdrop-blur"
          onClick={onBack}
          aria-label="Go back"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back
        </motion.button>

        <motion.p className="text-sm font-semibold text-[#1a3a2b]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          Intelligent Dish Search
        </motion.p>
        <motion.h1
          className="text-4xl font-black leading-tight text-[#0f2b1f]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        >
          What are you <span className="text-[#2f7c53]">craving</span> today?
        </motion.h1>
        <motion.p className="text-sm text-[#325042]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}>
          Discover plant-based gems curated for your palette.
        </motion.p>

        <SearchInput
          value={value}
          onValueChange={onValueChange}
          onSubmit={onSubmit}
          suggestions={filteredSuggestions}
          onSuggestionSelect={handleSuggestionSelect}
        />

        <SearchChips chips={chips} onChipSelect={onChipSelect} />

        <SearchResults results={results} onSelectResult={onSelectResult} />

        {didSearch && results.length === 0 && (
          <motion.div
            className="mt-6 max-w-md rounded-2xl bg-white/80 px-4 py-6 text-sm text-[#1c3a2b] shadow-md ring-1 ring-[#2f6b4a]/15"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="font-semibold text-[#2f6b4a]">No ready swaps yet.</p>
            <p className="mt-1 text-[#325042]">Try keywords like chicken, prawn, or biryani to see curated plant-based replacements.</p>
          </motion.div>
        )}

        <SearchFooter options={footerOptions} onActionSelect={() => triggerSubmit()} />
      </div>
    </motion.section>
  );
}
