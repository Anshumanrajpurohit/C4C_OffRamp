"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import type { ResultGroup } from "./types";

export type SearchResultsProps = {
  results: ResultGroup[];
  onSelectResult?: (dish: ResultGroup["items"][number]) => void;
};

function ResultGroupCard({ group, onSelectResult }: { group: ResultGroup; onSelectResult?: SearchResultsProps["onSelectResult"] }) {
  return (
    <motion.div
      className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-lg shadow-[#102717]/15"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#163528]">{group.title}</h3>
          <p className="text-sm text-[#2a4f3b]">{group.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#2f6b4a]">
          {group.keywords.map((keyword) => (
            <span key={keyword} className="rounded-full bg-[#f0fbf6] px-3 py-1">
              #{keyword}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {group.items.map((item) => (
          <button
            key={item.slug}
            type="button"
            className="group overflow-hidden rounded-[24px] bg-gradient-to-b from-white to-[#edf4e9] text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl"
            onClick={() => onSelectResult?.(item)}
          >
            <div className="relative h-40 w-full">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                className="object-cover"
              />
            </div>
            <div className="px-4 py-3 text-sm font-semibold text-[#1d2f21]">{item.name}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function SearchResults({ results, onSelectResult }: SearchResultsProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 w-full space-y-6 text-left">
      {results.map((group) => (
        <ResultGroupCard key={group.id} group={group} onSelectResult={onSelectResult} />
      ))}
    </div>
  );
}
