"use client";

import { motion } from "framer-motion";
import type { FormEvent } from "react";

export type SearchInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  suggestions: string[];
  onSuggestionSelect: (value: string) => void;
};

export function SearchInput({ value, onValueChange, onSubmit, suggestions, onSuggestionSelect }: SearchInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(value.trim());
  };

  return (
    <motion.form
      className="relative w-full max-w-3xl"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.18 }}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-lg shadow-[#0f2015]/40 backdrop-blur">
        <span className="text-[#2b6c48]">🔍</span>
        <input
          className="w-full bg-transparent text-sm font-semibold text-[#14281c] placeholder:text-[#4b5f53] outline-none"
          placeholder="Search for jackfruit tacos, vegan sushi..."
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
        <motion.button
          type="submit"
          className="rounded-full bg-[#2f6b4a] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-[#16402a]/40"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
        >
          Search
        </motion.button>
      </div>

      {suggestions.length > 0 && (
        <motion.div
          className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl shadow-[#0a1a13]/20 backdrop-blur"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
        >
          <ul className="divide-y divide-[#e1ebe3] text-left text-sm font-semibold text-[#1a3a2b]">
            {suggestions.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-[#f5fff7]"
                  onClick={() => onSuggestionSelect(item)}
                >
                  <span className="text-[#2f6b4a]">↗</span>
                  <span>{item}</span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.form>
  );
}
