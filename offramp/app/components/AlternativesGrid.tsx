"use client";

import { motion } from "framer-motion";

export type AltCard = {
  slug: string;
  name: string;
  badge: string;
  time: string;
  cost: string;
  rating: string;
  tags: string[];
  img: string;
};

type Props = {
  cards: AltCard[];
  onSelect?: (slug: string) => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onFilterClick?: (label: string) => void;
  onBack?: () => void;
};

export function AlternativesGrid({ cards, onSelect, onPrimaryAction, onSecondaryAction, onFilterClick, onBack }: Props) {
  return (
    <motion.section
      className="rounded-3xl bg-white px-6 py-8 shadow-xl ring-1 ring-black/5"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <motion.button
                className="rounded-full px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                onClick={onBack}
                aria-label="Back to search"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ←
              </motion.button>
            )}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#2f6b4a]">Impact Focus</h2>
              <h1 className="text-3xl font-black text-[#1f2c22]">Small Swaps, Big Impact</h1>
              <p className="max-w-xl text-sm text-gray-600">
                Switching just one meal a day can save up to 1000L of water. Discover delicious, wallet-friendly alternatives below that taste just like home.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                <motion.button
                  className="rounded-full border border-[#2f6b4a] px-4 py-2 text-[#2f6b4a]"
                  onClick={onPrimaryAction}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  View Impact Calculator
                </motion.button>
                <motion.button
                  className="rounded-full border border-gray-200 px-4 py-2 text-gray-700"
                  onClick={onSecondaryAction}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Watch Success Stories
                </motion.button>
              </div>
            </div>
          </div>
          <motion.div
            className="h-40 w-72 overflow-hidden rounded-2xl bg-[#0f3d23] shadow-lg"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
            whileHover={{ rotate: -1.5, scale: 1.02 }}
          >
            <div className="flex h-full items-center justify-center text-white">Dish hero</div>
          </motion.div>
        </div>

        <motion.div
          className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-700"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } } }}
        >
          {["High Protein", "Under Rs 100", "10-30 Min", "More filters"].map((label) => (
            <motion.button
              key={label}
              className={`rounded-full px-3 py-1 ${label === "High Protein" ? "bg-[#0f3d23] text-white" : "bg-gray-100"}`}
              onClick={() => onFilterClick?.(label)}
              variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
            >
              {label}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          className="grid gap-4 md:grid-cols-3 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }}
        >
          {cards.map((card) => (
            <motion.button
              key={card.slug}
              className="overflow-hidden rounded-2xl bg-white text-left shadow-md ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg"
              onClick={() => onSelect?.(card.slug)}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="h-32 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${card.img})` }}
              />
              <div className="space-y-2 px-4 py-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
                  <span>{card.time}</span>
                  <span>{card.cost}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1f2c22]">
                  <span>{card.name}</span>
                  <span className="rounded-full bg-[#eef5f0] px-2 py-1 text-[#2f6b4a]">{card.rating}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {card.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-2 w-full rounded-full border border-gray-200 py-2 text-center text-xs font-bold text-gray-700">
                  View Recipe
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
