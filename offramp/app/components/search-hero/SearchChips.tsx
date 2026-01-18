"use client";

import { motion } from "framer-motion";

export type SearchChipsProps = {
  chips: string[];
  onChipSelect?: (chip: string) => void;
};

export function SearchChips({ chips, onChipSelect }: SearchChipsProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-[#1b3a2c]"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }}
    >
      <span className="flex items-center gap-1 rounded-full border border-[#2f6b4a]/20 bg-white/60 px-3 py-1 text-[#2f6b4a]">
        ↗ Trending now
      </span>
      {chips.map((chip) => (
        <motion.button
          key={chip}
          className="rounded-full border border-white/60 bg-gradient-to-r from-[#e8f5ef] to-[#dbeee2] px-4 py-2 text-[12px] text-[#1c3a2b] shadow-sm transition hover:-translate-y-0.5"
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChipSelect?.(chip)}
        >
          {chip}
        </motion.button>
      ))}
    </motion.div>
  );
}
