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

type SmartSwapItem = {
  name: string;
  price: string;
  url: string;
  highlight?: boolean;
};

const smartSwapItems: SmartSwapItem[] = [
  {
    name: "Tempeh Tikka Bowl",
    price: "₹165",
    url: "https://www.swiggy.com/",
    highlight: true,
  },
  {
    name: "Jackfruit Seekh Wrap",
    price: "₹150",
    url: "https://www.swiggy.com/",
  },
  {
    name: "Tofu Butter Meal",
    price: "₹175",
    url: "https://www.swiggy.com/",
  },
  {
    name: "Mushroom Biryani Kit",
    price: "₹160",
    url: "https://www.swiggy.com/",
  },
];

export function DishDetail({ dish, onCook, onBack }: Props) {
  const crumbs: Crumb[] = [
    { label: "Recipes", onClick: onBack },
    { label: dish.course },
    { label: dish.region },
  ];
  const handleCookClick = () => {
    if (onCook) onCook();
  };
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
  const difficultyLabel = dish.steps.length >= 6 ? "Involved" : dish.steps.length >= 4 ? "Medium" : "Quick";
  const servingsLabel = "Serves 4";
  const heroDescription = dish.heroSummary ?? dish.whyItWorks;
  const metaHighlights = [
    { label: "Ready in", value: dish.totalTime },
    { label: "Difficulty", value: difficultyLabel },
    { label: "Calories", value: `${calories} kcal` },
    { label: "Servings", value: servingsLabel },
  ];
  const quickFacts = [
    { icon: "⏱", label: "Prep", value: dish.prepTime },
    { icon: "🍽️", label: "Course", value: dish.course },
    { icon: "🌶️", label: "Flavor", value: dish.flavorProfile },
    { icon: "🌿", label: "Diet", value: dietLabel },
  ];
  const impactStats = [
    { label: "Water Saved", value: "900L", helper: "Per batch" },
    { label: "CO₂ Reduced", value: "2.5kg", helper: "vs chicken" },
    { label: "Land Freed", value: "12m²", helper: "Annualized" },
  ];
  const reviewEntries = [
    { name: "Priya M.", rating: 5, text: "Never thought I'd enjoy a plant-based version this much. The texture is spot on!", time: "2 days ago" },
    { name: "Arjun K.", rating: 5, text: "My family couldn't tell the difference. Will definitely make this again.", time: "1 week ago" },
    { name: "Sneha R.", rating: 4, text: "Great swap for weeknight dinners. Quick and satisfying.", time: "2 weeks ago" },
  ];
  const storyPoints = (dish.chefTips || []).slice(0, 3);

  return (
    <motion.section
      className="rounded-[40px] bg-[#f3f7f1] px-4 py-6 shadow-[0_40px_90px_rgba(21,52,37,0.12)]"
      initial={{ opacity: 0.9, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mx-auto flex flex-col gap-8 text-[#1d2a1f] lg:gap-10" style={{ maxWidth: "1100px" }}>
        <div className="flex flex-wrap items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6a7a70]">
          <div className="flex flex-wrap items-center gap-2">
            {crumbs.map((crumb, idx) => (
              <div key={crumb.label} className="flex items-center gap-2">
                <button
                  className={`transition ${crumb.onClick ? "hover:text-[#1a3f2b]" : "cursor-default"}`}
                  onClick={crumb.onClick}
                  disabled={!crumb.onClick}
                >
                  {crumb.label}
                </button>
                {idx < crumbs.length - 1 && <span className="text-[#b9c6be]">/</span>}
              </div>
            ))}
          </div>
          <button className="text-[#1a3f2b] underline decoration-dotted" onClick={onBack}>
            Back to results
          </button>
        </div>

        <div className="grid gap-8 rounded-[32px] bg-white/80 p-6 shadow-sm lg:grid-cols-[1.05fr,0.95fr] lg:p-8">
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[28px] border border-[#e7ede8] bg-[#f4f7f3] shadow-inner">
              <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/80 px-4 py-1 text-[12px] font-bold uppercase text-[#1b412c] shadow-sm">
                <span>Signature Swap</span>
              </div>
              <div
                className="h-[320px] w-full bg-cover bg-center transition-transform duration-500 hover:scale-[1.02]"
                style={{ backgroundImage: `url(${dish.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-full bg-black/30 px-4 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                Trending in {trendingCity}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickFacts.map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-[#e6ece7] bg-white px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#90a298]">{fact.label}</div>
                  <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-[#122016]">
                    <span>{fact.icon}</span>
                    <span>{fact.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 text-sm font-semibold text-[#1f5136]">
                <span className="rounded-full bg-[#e5f3ec] px-3 py-1 text-xs uppercase tracking-wide text-[#1f5136]">
                  {dish.course} · {dish.region}
                </span>
                <div className="flex items-center gap-1 text-[#1f5136]">
                  <span className="text-base">★</span>
                  <span className="font-bold">{rating.toFixed(1)}</span>
                  <button className="text-xs text-[#5d7168] underline decoration-dotted">({reviews.toLocaleString()} reviews)</button>
                </div>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-[#111a11] lg:text-5xl">
                {firstWord}
                {restName ? <span className="text-[#1f5136]"> {restName}</span> : null}
                <span className="block text-base font-semibold uppercase tracking-[0.35em] text-[#9aa99f]">Plant-Rich Upgrade</span>
              </h1>
              <p className="text-lg leading-relaxed text-[#4a5a51]">{heroDescription}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-[#1f5136] px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#173d29]"
                  onClick={handleCookClick}
                >
                  Cook this swap
                </button>
                <button
                  className="rounded-full border border-[#1f5136] px-5 py-3 text-sm font-semibold uppercase tracking-widest text-[#1f5136] transition hover:-translate-y-0.5 hover:bg-[#e7f2ec]"
                  onClick={onBack}
                >
                  Back to ideas
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {metaHighlights.map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#ebf1ed] bg-[#f9fbf9] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9fb0a6]">{item.label}</p>
                  <p className="text-2xl font-semibold text-[#1c2e20]">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-[#e6ece7] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#5c6d63] uppercase tracking-widest">Smart swap savings</p>
                <span className="rounded-full bg-[#eef5f0] px-3 py-1 text-xs font-semibold text-[#1e4b33]">Save + enjoy</span>
              </div>
              <div className="space-y-3 text-sm font-semibold text-[#2b3d31]">
                <div className="flex items-center justify-between rounded-2xl bg-[#f7f9f7] px-4 py-3 text-[#919f95]">
                  <span>Traditional ({dietLabel === "Vegan" ? "non-vegan" : "non-veg"})</span>
                  <span className="line-through">{priceOriginal}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-[#e8f5ed] px-4 py-3 text-[#1f5136]">
                  <span>{dish.name}</span>
                  <span className="font-bold">{priceSwap}</span>
                </div>
                {smartSwapItems.map((item) => (
                  <div key={item.name} className={`rounded-2xl px-4 py-3 ${item.highlight ? "bg-[#f3faf5] text-[#1f5136]" : "bg-[#fbfcfb] text-[#38473f]"}`}>
                    <div className="flex items-center justify-between text-base font-semibold">
                      <span>{item.name}</span>
                      <span className={item.highlight ? "text-[#1f5136]" : "text-[#92a195]"}>{item.price}</span>
                    </div>
                    <a
                      className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#1f5136] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1f5136] transition hover:bg-[#1f5136] hover:text-white"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Buy on Swiggy →
                    </a>
                  </div>
                ))}
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c2742f]">Small swaps add up in rupees.</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e6ece7] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9fb0a6]">Replaces</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {dish.replaces.map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-2xl border border-[#eef3ef] px-4 py-2 text-sm font-semibold text-[#2d3b32]">
                    <span>{item}</span>
                    <span className="text-[#a7b5ac]">✕</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <motion.div className="rounded-[32px] border border-[#dde8df] bg-white p-6 shadow-sm" initial={{ opacity: 0.9, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#132316]">Watch how it's made</h2>
              {hasVideo && (
                <a className="text-sm font-semibold text-[#1f5136] underline decoration-dotted" href={videoWatchUrl} target="_blank" rel="noreferrer">
                  Open on YouTube
                </a>
              )}
            </div>
            <div className="overflow-hidden rounded-[24px] bg-black">
              {hasVideo && mounted ? (
                <iframe
                  className="aspect-video w-full"
                  src={`${videoEmbedUrl}?rel=0`}
                  title={`${dish.name} tutorial`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <div className="relative flex aspect-video items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${dish.image})` }}>
                  <div className="absolute inset-0 bg-black/40" />
                  <span className="relative rounded-full bg-white/90 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-[#1f5136]">Play</span>
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid gap-6">
            <div className="rounded-[28px] border border-[#dde8df] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9fb0a6]">Nutrition snapshot</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Calories", value: `${calories} kcal` },
                  { label: "Protein", value: protein },
                  { label: "Fiber", value: fiber },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-[#eef3ef] bg-[#f8fbf8] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9fb0a6]">{metric.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-[#152315]">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#dde8df] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9fb0a6]">Quick impact</p>
              <div className="mt-4 grid gap-3">
                {impactStats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between rounded-2xl bg-[#f5faf7] px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9fb0a6]">{stat.label}</p>
                      <p className="text-xs text-[#819287]">{stat.helper}</p>
                    </div>
                    <p className="text-2xl font-semibold text-[#1b3827]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[32px] border border-[#dde8df] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#132316]">Ingredients</h3>
              <span className="text-sm font-semibold text-[#90a298]">Serves 4</span>
            </div>
            <ul className="space-y-3">
              {dish.ingredients.map((ingredient) => {
                const buyUrl = `https://blinkit.com/s/?q=${encodeURIComponent(ingredient.item)}`;
                return (
                  <li key={ingredient.item} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eef3ef] px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9fb0a6]">{ingredient.quantity}</p>
                      <p className="text-sm font-semibold text-[#1f2d21]">{ingredient.item}</p>
                    </div>
                    <a
                      className="rounded-full border border-[#1f5136] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#1f5136] transition hover:bg-[#1f5136] hover:text-white"
                      href={buyUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Buy
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-[#dde8df] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9fb0a6]">Why this swap works</p>
              <p className="mt-3 text-lg leading-relaxed text-[#37483f]">{heroDescription}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#4f5f56]">
                {storyPoints.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="text-[#1f5136]">▸</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[32px] border border-[#dde8df] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9fb0a6]">Return to results</p>
              <button
                className="mt-3 w-full rounded-full border border-[#1f5136] px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#1f5136] transition hover:bg-[#1f5136] hover:text-white"
                onClick={onBack}
              >
                Back to search
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[36px] border border-[#182b1d] bg-[#182b1d] p-8 text-white shadow-2xl">
          <div className="grid gap-6 md:grid-cols-3">
            {impactStats.map((stat) => (
              <div key={stat.label} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">{stat.label}</p>
                <p className="mt-2 text-4xl font-black">{stat.value}</p>
                <p className="text-xs text-white/70">{stat.helper}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-[#dde8df] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#132316]">What people say</h3>
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9fb0a6]">{reviews.toLocaleString()} reviews</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {reviewEntries.map((review) => (
              <div key={review.name} className="rounded-3xl border border-[#eef3ef] bg-[#f9fbf9] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1f5136]">{review.name.charAt(0)}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#1b2c20]">{review.name}</p>
                      <p className="text-xs text-[#7f8f86]">{review.time}</p>
                    </div>
                  </div>
                  <span className="text-[#1f5136]">{"★".repeat(review.rating)}</span>
                </div>
                <p className="text-sm text-[#405046]">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,0.8fr]">
          <div className="rounded-[32px] border border-[#dde8df] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#132316]">Why small swaps matter</h3>
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9fb0a6]">Data-backed</span>
            </div>
            <p className="text-sm leading-relaxed text-[#405046]">
              Food systems drive emissions, water loss, and animal impact. OffRamp turns familiar cravings into measurable change by highlighting like-for-like dishes that simply happen to be plant-led.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[{ label: "Meals swapped", value: "2,847" }, { label: "Water saved", value: "1.2M L" }, { label: "CO₂ avoided", value: "4.8T" }].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#eef3ef] bg-[#f9fbf9] px-4 py-4 text-center">
                  <p className="text-3xl font-black text-[#1f5136]">{stat.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9fb0a6]">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.4em] text-[#c2742f]">No guilt. Just data.</p>
          </div>

          <div className="rounded-[32px] border border-[#dde8df] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9fb0a6]">Ethical micro note</p>
            <p className="mt-3 text-sm text-[#6c7c73]">
              🌱 Small swaps like these reduce environmental impact without changing what you love to eat.
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-[#dde8df] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#132316]">More plant-based picks</h3>
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9fb0a6]">Scroll sideways</span>
          </div>
          <div className="relative -mx-2 overflow-x-auto pb-2" style={{ scrollBehavior: "smooth" }}>
            <div className="flex gap-4 px-2">
              {smartSwapItems.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex w-56 shrink-0 flex-col rounded-[28px] border px-3 pb-4 pt-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                    item.highlight ? "border-[#1f5136] bg-gradient-to-br from-[#f3faf5] to-white" : "border-[#eef3ef] bg-white"
                  }`}
                >
                  <div className="relative h-36 w-full overflow-hidden rounded-[22px] bg-[#f3f7f3]">
                    <div
                      className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url(${dish.image})` }}
                    />
                    {item.highlight && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#1f5136] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white">
                        Current pick
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-base font-semibold text-[#1b2c20]">{item.name}</p>
                      <p className="text-xs text-[#7a8a81]">{item.price}</p>
                    </div>
                    <span className="mt-3 inline-flex items-center justify-center rounded-full border border-[#1f5136] px-4 py-1 text-xs font-bold uppercase tracking-[0.35em] text-[#1f5136] transition group-hover:bg-[#1f5136] group-hover:text-white">
                      Buy on Swiggy →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 right-6 z-40">
        <button
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1f5136] text-white shadow-xl transition hover:scale-105 hover:bg-[#173d29]"
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
