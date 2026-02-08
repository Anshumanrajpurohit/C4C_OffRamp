"use client";

import dynamic from "next/dynamic";
import { Playfair_Display } from "next/font/google";
import { useState } from "react";

import type { DishDetail as DishDetailType } from "../../lib/dishes";

const ChatWidget = dynamic(() => import("./ChatWidget").then((m) => m.ChatWidget), { ssr: false });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700"] });

type Props = {
  dish: DishDetailType;
  onCook?: () => void;
  onBack?: () => void;
};

type TabKey = "cook" | "buy" | "impact" | "reviews";
type StatChip = { icon: string; title: string; value: string; accent?: boolean };

const tabButtons: Array<{ id: TabKey; label: string; icon: string }> = [
  { id: "cook", label: "Cook", icon: "restaurant" },
  { id: "buy", label: "Buy", icon: "shopping_bag" },
  { id: "impact", label: "Why?", icon: "eco" },
  { id: "reviews", label: "Reviews", icon: "rate_review" },
];

const iconPool = ["dataset", "eco", "local_fire_department", "emoji_nature", "water_drop", "spa", "egg", "grocery", "restaurant"];

const fallbackReviews = [
  { name: "Jane D.", rating: 5, text: "Tempeh texture is insane. No one missed the seafood.", time: "2 days ago" },
  { name: "Arjun K.", rating: 5, text: "Swapped for Sunday lunch. Tangy and rich without fish.", time: "1 week ago" },
  { name: "Meera L.", rating: 4, text: "Loved the creamy gravy. Added extra curry leaves for crunch.", time: "2 weeks ago" },
];

const formatTimeLabel = (value?: string) => value ?? "40m";
const formatCaloriesLabel = (value?: string) => (value ? `${value} kcal` : "350 kcal");
const nutritionIconMap: Record<string, string> = {
  Calories: "local_fire_department",
  Protein: "monitor_weight",
  Fiber: "spa",
};

export function DishDetail({ dish, onBack, onCook }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const heroSummary = dish.heroSummary ?? dish.whyItWorks;
  const rating = dish.rating ?? 4.8;
  const reviewCount = dish.reviews ?? 124;
  const totalTime = formatTimeLabel(dish.totalTime || dish.cookTime || dish.prepTime);
  const servingsLabel = "Serves 4";
  const nutrition = [
    { label: "Calories", value: formatCaloriesLabel(dish.calories) },
    { label: "Protein", value: dish.protein ?? "20g" },
    { label: "Fiber", value: dish.fiber ?? "6g" },
  ];
  const heroChips: StatChip[] = [
    { icon: "schedule", title: "Minutes", value: totalTime },
    { icon: "group", title: "Serves", value: servingsLabel },
    {
      icon: "star",
      title: "Rating",
      value: `${rating.toFixed(1)} (${new Intl.NumberFormat("en").format(reviewCount)})`,
      accent: true,
    },
  ];
  const nutritionChips: StatChip[] = nutrition.map((metric) => ({
    icon: nutritionIconMap[metric.label] ?? "dataset",
    title: metric.label,
    value: metric.value,
  }));
  const steps = dish.steps.length
    ? dish.steps
    : [
        { step: 1, instruction: "Toast aromatics until fragrant", time: "5 min" },
        { step: 2, instruction: "Simmer coconut base gently", time: "12 min" },
      ];
  const buyCatalog = dish.ingredients.length ? dish.ingredients : [{ item: dish.name, quantity: "To taste" }];
  const impactStats = [
    { icon: "water_drop", label: "Water Saved", value: "450L", helper: "vs seafood curry" },
    { icon: "cloud", label: "CO2 Reduced", value: "2.4kg", helper: "per serving" },
    { icon: "pets", label: "Animal Lives", value: "Safe", helper: "100% plant based" },
  ];
  const tips = dish.chefTips.length
    ? dish.chefTips
    : [
        "Toast spices in coconut oil for coastal aroma.",
        "Finish with tamarind water for brightness.",
        "Garnish with fried curry leaves for snap.",
      ];
  const reviews = fallbackReviews;

  const videoEmbed = dish.videoId ? `https://www.youtube.com/embed/${dish.videoId}?rel=0` : null;

  const renderCookTab = () => (
    <div className="flex flex-col gap-8 md:flex-row">
      <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 md:w-1/2">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-2xl font-semibold">Ingredients</h3>
          <span className="text-xs font-bold uppercase tracking-[0.35em] text-white/60">{servingsLabel}</span>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4 pr-2">
          {buyCatalog.map((ingredient) => (
            <label key={ingredient.item} className="flex items-center gap-3 text-sm text-white/80">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-white/40 bg-transparent text-primary focus:ring-[#0D5C46]"
              />
              <span className="flex flex-1 flex-col">
                <span className="font-semibold text-white">{ingredient.item}</span>
                <span className="text-xs text-white/50">{ingredient.quantity}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex w-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 md:w-1/2">
        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black/40">
          {videoEmbed ? (
            <iframe
              className="h-full w-full"
              src={videoEmbed}
              title={`${dish.name} tutorial`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
              <span className="material-symbols-outlined text-5xl text-white/60">videocam_off</span>
              <p className="text-sm font-semibold text-white/70">Tutorial coming soon</p>
            </div>
          )}
          {videoEmbed && (
            <p className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white">
              Watch Tutorial
            </p>
          )}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {steps.slice(0, 4).map((step) => (
            <div key={step.step} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0FD688]">Step {step.step}</p>
              <p className="text-sm text-white/80">{step.instruction}</p>
              <p className="text-xs text-white/40">{step.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBuyTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <button className="flex flex-col items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-[#0D5C46] to-[#0a3f30] p-6 text-center shadow-xl transition hover:-translate-y-1">
          <span className="material-symbols-outlined text-4xl mb-2">dinner_dining</span>
          <span className="text-xl font-bold">Buy Full Dish</span>
          <span className="text-sm text-white/80">Delivered hot in select cities</span>
        </button>
        <button className="flex flex-col items-center justify-center rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-xl transition hover:-translate-y-1">
          <span className="material-symbols-outlined text-4xl mb-2">grocery</span>
          <span className="text-xl font-bold">Buy Ingredient Kit</span>
          <span className="text-sm text-white/70">Pre-portioned produce + spice pack</span>
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {buyCatalog.slice(0, 9).map((ingredient, index) => (
          <div key={ingredient.item} className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70">
                <span className="material-symbols-outlined text-lg">{iconPool[index % iconPool.length]}</span>
              </div>
              <div>
                <p className="font-semibold text-white">{ingredient.item}</p>
                <p className="text-xs text-white/60">{ingredient.quantity}</p>
              </div>
            </div>
            <button className="rounded-full bg-[#0D5C46] px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white">
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderImpactTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {impactStats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-white/15 bg-white/5 p-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[#0FD688]">
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-white/50">{stat.helper}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-white/15 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Why this swap works</p>
        <p className="mt-3 text-lg text-white/90">{heroSummary}</p>
        <ul className="mt-4 space-y-2 text-sm text-white/75">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-[#0FD688]">?</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderReviewsTab = () => (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:w-1/3">
        <p className="text-2xl font-semibold">Write a review</p>
        <p className="mt-2 text-sm text-white/70">Share your cooking experience with the community.</p>
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <span key={idx} className="material-symbols-outlined cursor-pointer text-3xl text-white/30 transition hover:text-yellow-400">
              star
            </span>
          ))}
        </div>
        <textarea
          className="mt-4 w-full rounded-2xl border border-white/20 bg-black/20 p-4 text-sm text-white placeholder:text-white/40 focus:outline-none"
          rows={4}
          placeholder="What stood out in this swap?"
        />
        <button className="mt-4 w-full rounded-full bg-white/90 py-3 text-sm font-black uppercase tracking-[0.35em] text-black">
          Submit
        </button>
      </div>
      <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:w-2/3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">{reviewCount.toLocaleString()} reviews</p>
          <p className="text-sm text-white/70">Rated {rating.toFixed(1)} overall</p>
        </div>
        <div className="mt-4 space-y-4 overflow-y-auto pr-2" style={{ maxHeight: "320px" }}>
          {reviews.map((review) => (
            <div key={review.name} className="rounded-2xl border border-white/15 bg-black/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                    {review.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{review.name}</p>
                    <p className="text-xs text-white/50">{review.time}</p>
                  </div>
                </div>
                <span className="text-yellow-300">{"?".repeat(review.rating)}</span>
              </div>
              <p className="mt-2 text-sm text-white/80">{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabPanels: Record<TabKey, JSX.Element> = {
    cook: renderCookTab(),
    buy: renderBuyTab(),
    impact: renderImpactTab(),
    reviews: renderReviewsTab(),
  };
  const currentPanel = activeTab ? tabPanels[activeTab] : null;

  return (
    <section className="relative isolate flex min-h-dvh w-full overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <img src={dish.image} alt={dish.name} className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-dvh w-full flex-col px-3 pb-8 pt-6 sm:px-6 lg:px-12">
        <header className="flex w-full items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] transition hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-3">
            {onCook && (
              <button
                onClick={onCook}
                className="hidden items-center gap-2 rounded-full border border-white/20 bg-[#0D5C46] px-5 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-white shadow-lg transition hover:-translate-y-0.5 sm:flex"
              >
                <span className="material-symbols-outlined text-base">restaurant</span>
                Cook Swap
              </button>
            )}
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              Ask OffRamp
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-between">
          <div className="flex flex-col gap-6">
            <div className="max-w-3xl drop-shadow-lg">
              <h1 className={`${playfair.className} text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-7xl`}>
                {dish.name}
              </h1>
              <p className="mt-2 text-base font-light italic text-white/80 sm:text-xl">{heroSummary}</p>
            </div>
            <div className="mt-4 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {heroChips.map((stat) => (
                <div
                  key={`${stat.title}-${stat.value}`}
                  className="flex items-center gap-4 rounded-2xl border border-white/15 bg-black/30 px-4 py-4 shadow-lg"
                >
                  <span
                    className={`material-symbols-outlined text-2xl ${stat.accent ? "text-yellow-300" : "text-white/80"}`}
                  >
                    {stat.icon}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/60">{stat.title}</p>
                    <p className="text-lg font-semibold text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/15 bg-black/30 px-5 py-4 shadow-lg">
              <div className="grid gap-4 sm:grid-cols-3">
                {nutritionChips.map((metric) => (
                  <div key={`${metric.title}-${metric.value}`} className="flex items-center gap-3 text-white">
                    <span className="material-symbols-outlined text-xl text-[#0FD688]">{metric.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/70">{metric.title}</p>
                      <p className="text-lg font-bold">{metric.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl">
              <div className="relative max-h-[65vh] overflow-hidden">
                {currentPanel && (
                  <div
                    key={activeTab ?? "default"}
                    className="animate-slide-up max-h-[65vh] overflow-y-auto px-5 py-6 pr-3 md:px-8 md:py-8"
                  >
                    {currentPanel}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {tabButtons.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full min-h-[5.5rem] flex-col items-center justify-center rounded-[24px] border border-white/10 bg-[#0D5C46] text-white shadow-lg transition-all duration-300 sm:min-h-[6.5rem] ${
                      isActive ? "ring-2 ring-white/60 scale-[1.02]" : "opacity-90 hover:opacity-100"
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">{tab.icon}</span>
                    <span className="font-semibold text-[10px] tracking-[0.45em] uppercase">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 right-6 z-40">
        <button
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0D5C46] text-white shadow-xl transition hover:scale-105"
          onClick={() => setChatOpen(true)}
          aria-label={`Chat about ${dish.name}`}
        >
          ??
        </button>
      </div>

      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} dish={dish} />
    </section>
  );
}
