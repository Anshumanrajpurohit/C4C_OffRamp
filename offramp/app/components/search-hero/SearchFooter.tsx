"use client";

import { motion } from "framer-motion";

import type { FooterOption } from "./types";

export type SearchFooterProps = {
  options: FooterOption[];
  onActionSelect: (label: string) => void;
};

export function SearchFooter({ options, onActionSelect }: SearchFooterProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="mt-6 flex items-center justify-center gap-8 text-xs text-[#1b3a2c]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.32 }}
    >
      {options.map(({ label, icon }) => (
        <motion.button
          key={label}
          className="flex flex-col items-center gap-1"
          onClick={() => onActionSelect(label)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
