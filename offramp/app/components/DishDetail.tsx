"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("./ChatWidget").then((m) => m.ChatWidget), { ssr: false });

import type { DishDetail as DishDetailType } from "../../lib/dishes";

type Props = {
  dish: DishDetailType;
  onCook?: () => void;
  onBack?: () => void;
};

type Crumb = {
  label: string;
  onClick?: () => void;
};

export function DishDetail({ dish, onCook, onBack }: Props) {
  const crumbs: Crumb[] = [
    { label: "Recipes", onClick: onBack },
    { label: dish.course },
    { label: dish.region },
  ];

  const smartSwapItems = [
    {
      name: dish.name,
      price: "Plant-based pick",
      highlight: true,
      url: `https://www.swiggy.com/search?query=${encodeURIComponent(dish.name)}`,
    },
    {
      name: "Tofu Masala",
      price: "Vegan pantry win",
      highlight: false,
      url: "https://www.swiggy.com/search?query=tofu",
    },
    {
      name: "Jackfruit Curry",
      price: "Fiber-rich swap",
      highlight: false,
      url: "https://www.swiggy.com/search?query=jackfruit",
    },
    {
      name: "Tempeh Stir Fry",
      price: "Protein-packed pick",
      highlight: false,
      url: "https://www.swiggy.com/search?query=tempeh",
    },
  ];

  const rating = dish.rating ?? 4.9;
  const reviews = dish.reviews ?? 1200;
  const trendingCity = dish.trendingCity ?? dish.region;
  const calories = dish.calories ?? "320";
  const protein = dish.protein ?? "12g";
  const fiber = dish.fiber ?? "8g";
  const priceOriginal = dish.priceOriginal ?? "₹150";
  const priceSwap = dish.priceSwap ?? "₹90";

  const dietLabel = dish.diet === "vegan" ? "Vegan" : "Vegetarian";
  const [firstWord, ...restWords] = dish.name.split(" ");
  const restName = restWords.join(" ");
  const hasVideo = Boolean(dish.videoId);
  const videoEmbedUrl = hasVideo ? `https://www.youtube.com/embed/${dish.videoId}` : "";
  const videoWatchUrl = hasVideo ? `https://youtu.be/${dish.videoId}` : "";
  const [chatOpen, setChatOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <motion.section
      className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-6 px-6 py-6">
        <motion.div
          className="flex items-center justify-between text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-2">
            {crumbs.map((crumb, idx) => (
              <div key={crumb.label} className="flex items-center gap-2">
                <button
                  className={`transition ${crumb.onClick ? "hover:text-[#2f6b4a]" : "cursor-default"}`}
                  onClick={crumb.onClick}
                  disabled={!crumb.onClick}
                >
                  {crumb.label}
                </button>
                {idx < crumbs.length - 1 && <span>/</span>}
              </div>
            ))}
          </div>
          <button className="text-[#2f6b4a] font-semibold" onClick={onBack}>
            Back
          </button>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#136c56]">
                <span className="text-sm">★</span>
                <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                <button className="text-sm text-[#65867e] underline decoration-dotted">({reviews.toLocaleString()} reviews)</button>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[#1f2c22] md:text-4xl">
                The Ultimate <span className="text-[#136c56]">{firstWord}</span>{restName ? ` ${restName}` : ""}.
              </h1>
            </div>

            <motion.div
              className="relative w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
            >
              <div className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-full bg-[#136c56] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                <span>Trending</span>
              </div>
              <div className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${dish.image})`, minHeight: "320px" }} />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
            </motion.div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <motion.div
                className="flex h-full flex-col justify-between rounded-2xl bg-[#f0f4f3] px-5 py-4 text-[#121716] shadow-sm"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.35 }}
              >
                <div>
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-linear-to-r from-[#e8f5ef] via-[#f6e6d8] to-[#e8f5ef] px-3 py-2 text-[#136c56] hover:animate-pulse">
                    <span>💡</span>
                    <h3 className="text-sm font-bold uppercase tracking-wide">Why this swap works</h3>
                  </div>
                  <p className="text-sm md:text-base font-medium leading-relaxed text-[#121716]">{dish.heroSummary ?? dish.whyItWorks}</p>
                </div>
              </motion.div>

              <motion.div
                className="relative overflow-hidden rounded-2xl bg-black text-white shadow-sm"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
              >
                  {hasVideo && mounted ? (
                    <div className="relative flex flex-col gap-2">
                      <div className="relative aspect-video w-full">
                        <iframe
                          className="h-full w-full"
                          src={`${videoEmbedUrl}?rel=0`}
                          title={`${dish.name} tutorial`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                      <a
                        className="inline-flex items-center gap-2 self-start rounded-full border border-white/40 px-3 py-1 text-xs font-semibold transition hover:border-white hover:bg-white hover:text-black"
                        href={videoWatchUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Watch on YouTube
                      </a>
                    </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${dish.image})` }} />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative flex h-full min-h-50 items-center justify-center">
                      <div className="flex items-center justify-center rounded-full bg-[#136c56] px-5 py-4 text-white shadow-xl">
                        <span className="text-sm font-bold uppercase tracking-wide">Play</span>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 text-sm font-bold">Watch the step-by-step</div>
                  </>
                )}
              </motion.div>
            </div>

            <motion.div
              className="rounded-2xl border border-[#e5e8e6] bg-white px-5 py-4 shadow-sm"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold rounded-lg bg-linear-to-r from-[#e8f5ef] via-[#f6e6d8] to-[#e8f5ef] px-3 py-1 hover:animate-pulse">Ingredients</h3>
                <span className="text-sm font-medium text-[#65867e]">4 Servings</span>
              </div>
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-linear-to-r from-[#e8f5ef] via-[#f6e6d8] to-[#e8f5ef] px-3 py-2 text-sm font-bold text-gray-700 hover:animate-pulse">
                  Show full list
                  <span className="text-xs font-semibold text-[#2f6b4a] group-open:hidden">Expand</span>
                  <span className="text-xs font-semibold text-[#2f6b4a] hidden group-open:inline">Collapse</span>
                </summary>
                <ul className="mt-3 space-y-3 text-sm text-gray-700">
                  {dish.ingredients.map((ingredient) => {
                    const buyUrl = `https://blinkit.com/s/?q=${encodeURIComponent(ingredient.item)}`;
                    return (
                      <li
                        key={ingredient.item}
                        className="flex items-start gap-3 rounded-lg border border-dashed border-[#e5e8e6] px-3 py-2 hover:border-[#136c56]/50"
                      >
                        <div className="mt-1 h-5 w-5 rounded border-2 border-[#65867e]" />
                        <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-col text-sm">
                            <span className="font-semibold">{ingredient.quantity}</span>
                            <span className="text-gray-700">{ingredient.item}</span>
                          </div>
                          <a
                            className="rounded-full border border-[#136c56] px-3 py-1 text-xs font-bold text-[#136c56] transition hover:bg-[#136c56] hover:text-white"
                            href={buyUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Buy on Blinkit
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </motion.div>

            <motion.div
              className="rounded-2xl bg-[#d4ede4] px-5 py-4 text-[#0f3d23] shadow-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <div className="grid gap-4 md:grid-cols-3">
                {[{ label: "Animal Saved", value: "1" }, { label: "Water Saved", value: "900L" }, { label: "CO2 Reduced", value: "2.5kg" }].map((card) => (
                  <div key={card.label} className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#136c56]/15 via-[#f6e6d8]/40 to-[#136c56]/10 text-[#136c56]">🌿</div>
                    <div>
                      <p className="text-xl font-black leading-tight text-[#0f3d23]">{card.value}</p>
                      <p className="text-xs font-semibold text-[#136c56] uppercase">{card.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <motion.div
              className="rounded-2xl border border-[#e5e8e6] bg-white px-5 py-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#65867e] rounded-lg bg-linear-to-r from-[#e8f5ef] via-[#f6e6d8] to-[#e8f5ef] px-3 py-1 hover:animate-pulse">Quick facts</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="flex items-center gap-2 rounded-lg bg-[#f0f4f3] px-3 py-2 text-sm font-bold text-[#121716]"><span>⏱</span>{dish.totalTime}</span>
                <span className="flex items-center gap-2 rounded-lg bg-[#f0f4f3] px-3 py-2 text-sm font-bold text-[#121716]"><span>🌿</span>{dietLabel}</span>
                <span className="flex items-center gap-2 rounded-lg bg-[#f0f4f3] px-3 py-2 text-sm font-bold text-[#121716]"><span>🌶️</span>{dish.flavorProfile}</span>
              </div>
            </motion.div>

            <motion.div
              className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-4 text-gray-600 shadow-sm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#65867e] rounded-lg bg-linear-to-r from-[#e8f5ef] via-[#f6e6d8] to-[#e8f5ef] px-3 py-1 hover:animate-pulse">Replaces</h3>
              <div className="mt-3 flex flex-col gap-2">
                {dish.replaces.map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-medium">
                    <span>{item}</span>
                    <span className="text-gray-400">✕</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
            >
              <div className="rounded-2xl border border-[#e5e8e6] bg-white px-4 py-4 text-center shadow-sm">
                <span className="text-3xl font-black text-[#1f2c22]">{calories}</span>
                <div className="text-xs font-bold uppercase tracking-wide text-[#65867e]">Calories</div>
              </div>
              <div className="rounded-2xl border border-[#e5e8e6] bg-white px-4 py-4 text-center shadow-sm">
                <span className="text-3xl font-black text-[#1f2c22]">{protein}</span>
                <div className="text-xs font-bold uppercase tracking-wide text-[#65867e]">Protein</div>
              </div>
            </motion.div>

            <motion.div
              className="rounded-2xl border border-[#e5e8e6] bg-white px-5 py-5 shadow-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
            >
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-linear-to-r from-[#e8f5ef] via-[#f6e6d8] to-[#e8f5ef] px-3 py-2 text-base font-bold text-gray-700 hover:animate-pulse">
                  Smart swap savings
                  <span className="text-xs font-semibold text-[#2f6b4a] group-open:hidden">Show</span>
                  <span className="text-xs font-semibold text-[#2f6b4a] hidden group-open:inline">Hide</span>
                </summary>
                <div className="mt-4 space-y-3 text-sm font-semibold text-gray-700">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 line-through">Traditional (non-vegan)</span>
                    </div>
                    <span className="text-gray-500 line-through">{priceOriginal}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#eef5f0] px-4 py-3 text-[#2f6b4a]">
                    <div className="flex items-center gap-2 font-semibold">
                      <span>Plant-based: {dish.name}</span>
                    </div>
                    <span className="font-bold">{priceSwap}</span>
                  </div>
                  {smartSwapItems.map((item) => (
                    <div
                      key={item.name}
                      className={`flex flex-col gap-2 rounded-lg px-4 py-3 ${item.highlight ? "bg-[#eef5f0] text-[#2f6b4a]" : "bg-gray-50 text-gray-700"}`}
                    >
                      <div className="flex items-center justify-between text-base font-semibold">
                        <span>{item.name}</span>
                        <span className={item.highlight ? "" : "text-gray-500"}>{item.price}</span>
                      </div>
                      <a
                        className="w-fit rounded-full border border-[#2f6b4a] px-3 py-1.5 text-xs font-bold text-[#2f6b4a] transition hover:bg-[#2f6b4a] hover:text-white"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Buy on Swiggy
                      </a>
                    </div>
                  ))}
                  <div className="text-[#c76a2b] text-sm">You save with every vegan swap.</div>
                </div>
              </details>
            </motion.div>

            <motion.div
              className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
            >
              <h3 className="text-sm font-bold text-gray-700">Need to go back?</h3>
              <button
                className="mt-3 w-full rounded-full border border-[#2f6b4a] px-4 py-2 text-sm font-semibold text-[#2f6b4a]"
                onClick={onBack}
              >
                Return to results
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 right-6 z-40">
        <button
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#136c56] text-white shadow-xl transition hover:scale-105 hover:bg-[#0f5745]"
          onClick={() => setChatOpen(true)}
          aria-label={`Chat about ${dish.name}`}
        >
          💬
        </button>
      </div>

      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} dish={dish} />
    </motion.section>
  );
}
