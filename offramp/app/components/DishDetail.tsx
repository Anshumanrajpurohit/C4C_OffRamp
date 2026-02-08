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
type ReviewEntry = { name: string; rating: number; text: string; time: string };

const tabButtons: Array<{ id: TabKey; label: string; icon: string }> = [
  { id: "cook", label: "Cook", icon: "restaurant" },
  { id: "buy", label: "Buy", icon: "shopping_bag" },
  { id: "impact", label: "Why?", icon: "eco" },
  { id: "reviews", label: "Reviews", icon: "rate_review" },
];

const iconPool = ["dataset", "eco", "local_fire_department", "emoji_nature", "water_drop", "spa", "egg", "grocery", "restaurant"];

const fallbackReviews: ReviewEntry[] = [
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
  const [reviews, setReviews] = useState<ReviewEntry[]>(fallbackReviews);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewNotice, setReviewNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [ratingStats, setRatingStats] = useState(() => ({
    average: dish.rating ?? 4.8,
    count: dish.reviews ?? 124,
  }));

  const heroSummary = dish.heroSummary ?? dish.whyItWorks;
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
      value: `${ratingStats.average.toFixed(1)} (${new Intl.NumberFormat("en").format(ratingStats.count)})`,
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

  const handleReviewSubmit = () => {
    if (!userRating || reviewText.trim().length < 6) {
      setReviewNotice({ tone: "error", text: "Pick a rating and add a quick note." });
      return;
    }

    const entry: ReviewEntry = {
      name: "You",
      rating: userRating,
      text: reviewText.trim(),
      time: "just now",
    };

    setReviews((prev) => [entry, ...prev]);
    setRatingStats((prev) => {
      const nextCount = prev.count + 1;
      const nextAverage = (prev.average * prev.count + userRating) / nextCount;
      return { average: nextAverage, count: nextCount };
    });
    setUserRating(0);
    setReviewText("");
    setReviewNotice({ tone: "success", text: "Thanks for rating this swap!" });
  };

  const videoEmbed = dish.videoId ? `https://www.youtube.com/embed/${dish.videoId}?rel=0` : null;

  const renderCookTab = () => (
    <div className="flex flex-col gap-8 md:flex-row">
      <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-[#e1d8cd] bg-gradient-to-br from-white via-[#fef9ef] to-[#f4ecdf] shadow-[0_20px_60px_rgba(15,23,15,0.08)] md:w-1/2">
        <div className="flex items-center justify-between border-b border-[#eadfce] px-6 py-4">
          <h3 className="text-2xl font-semibold text-[#122219]">Ingredients</h3>
          <span className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">{servingsLabel}</span>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4 pr-2">
          {buyCatalog.map((ingredient) => (
            <label key={ingredient.item} className="flex items-center gap-3 text-sm text-[#1f2a23]">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-emerald-700/30 bg-white text-primary focus:ring-[#0FD688]"
              />
              <span className="flex flex-1 flex-col">
                <span className="font-semibold text-[#0f2017]">{ingredient.item}</span>
                <span className="text-xs text-slate-500">{ingredient.quantity}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex w-full flex-col rounded-3xl border border-[#e1d8cd] bg-gradient-to-br from-white via-[#faf2e6] to-[#f4ecdf] p-6 shadow-[0_20px_60px_rgba(15,23,15,0.08)] md:w-1/2">
        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-[#f4ece0]">
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
              <span className="material-symbols-outlined text-5xl text-slate-400">videocam_off</span>
              <p className="text-sm font-semibold text-slate-500">Tutorial coming soon</p>
            </div>
          )}
          {videoEmbed && (
            <p className="absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#153023]">
              Watch Tutorial
            </p>
          )}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {steps.slice(0, 4).map((step) => (
            <div key={step.step} className="rounded-2xl border border-[#e1d8cd] bg-white px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Step {step.step}</p>
              <p className="text-sm text-[#1c2b24]">{step.instruction}</p>
              <p className="text-xs text-slate-500">{step.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBuyTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <button className="flex flex-col items-center justify-center rounded-3xl border border-[#e1d8cd] bg-gradient-to-br from-white via-[#fef9ef] to-[#f4ecdf] p-6 text-center shadow-lg transition hover:-translate-y-1">
          <span className="material-symbols-outlined mb-2 text-4xl text-emerald-600">dinner_dining</span>
          <span className="text-xl font-bold text-[#102117]">Buy Full Dish</span>
          <span className="text-sm text-slate-500">Delivered hot in select cities</span>
        </button>
        <button className="flex flex-col items-center justify-center rounded-3xl border border-[#e1d8cd] bg-gradient-to-br from-white via-[#f8f1e5] to-[#efe3d1] p-6 text-center shadow-lg transition hover:-translate-y-1">
          <span className="material-symbols-outlined mb-2 text-4xl text-emerald-600">grocery</span>
          <span className="text-xl font-bold text-[#102117]">Buy Ingredient Kit</span>
          <span className="text-sm text-slate-500">Pre-portioned produce + spice pack</span>
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {buyCatalog.slice(0, 9).map((ingredient, index) => (
          <div key={ingredient.item} className="flex items-center justify-between rounded-2xl border border-[#e1d8cd] bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <span className="material-symbols-outlined text-lg">{iconPool[index % iconPool.length]}</span>
              </div>
              <div>
                <p className="font-semibold text-[#102117]">{ingredient.item}</p>
                <p className="text-xs text-slate-500">{ingredient.quantity}</p>
              </div>
            </div>
            <button className="rounded-full bg-gradient-to-r from-[#10b981] to-[#0b8a60] px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white">
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
          <div key={stat.label} className="rounded-3xl border border-[#e1d8cd] bg-gradient-to-br from-white via-[#fdf7ef] to-[#f4ecdf] p-5 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{stat.label}</p>
            <p className="text-3xl font-bold text-[#102117]">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.helper}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-[#e1d8cd] bg-white/90 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Why this swap works</p>
        <p className="mt-3 text-lg text-[#142118]">{heroSummary}</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-emerald-600">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderReviewsTab = () => (
    <div className="flex flex-col gap-6 md:flex-row">
      <form
        className="rounded-3xl border border-[#e1d8cd] bg-white p-6 shadow-sm md:w-1/3"
        onSubmit={(event) => {
          event.preventDefault();
          handleReviewSubmit();
        }}
      >
        <p className="text-2xl font-semibold text-[#102117]">Write a review</p>
        <p className="mt-2 text-sm text-slate-600">Share your cooking experience with the community.</p>
        <div className="mt-4 flex gap-2" role="radiogroup" aria-label="Rate this dish">
          {Array.from({ length: 5 }).map((_, idx) => {
            const value = idx + 1;
            const active = value <= userRating;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setUserRating(value);
                  setReviewNotice(null);
                }}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                aria-pressed={active}
                className={`material-symbols-outlined text-3xl transition ${
                  active ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" : "text-slate-300 hover:text-slate-500"
                }`}
              >
                {active ? "grade" : "star"}
              </button>
            );
          })}
        </div>
        <textarea
          className="mt-4 w-full rounded-2xl border border-[#e1d8cd] bg-[#fdf8f1] p-4 text-sm text-[#142118] placeholder:text-slate-400 focus:outline-none"
          rows={4}
          placeholder="What stood out in this swap?"
          value={reviewText}
          onChange={(event) => {
            setReviewText(event.target.value);
            setReviewNotice(null);
          }}
        />
        <button type="submit" className="mt-4 w-full rounded-full bg-gradient-to-r from-[#10b981] to-[#0b8a60] py-3 text-sm font-black uppercase tracking-[0.35em] text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]">
          Submit
        </button>
        {reviewNotice && (
          <p
            className={`mt-3 text-xs font-semibold uppercase tracking-[0.3em] ${
              reviewNotice.tone === "success" ? "text-emerald-600" : "text-amber-500"
            }`}
          >
            {reviewNotice.text}
          </p>
        )}
      </form>
      <div className="rounded-3xl border border-[#e1d8cd] bg-white/95 p-6 shadow-sm md:w-2/3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{ratingStats.count.toLocaleString()} reviews</p>
          <p className="text-sm text-slate-600">Rated {ratingStats.average.toFixed(1)} overall</p>
        </div>
        <div className="mt-4 space-y-4 overflow-y-auto pr-2" style={{ maxHeight: "320px" }}>
          {reviews.map((review) => (
            <div key={`${review.name}-${review.time}-${review.text}`} className="rounded-2xl border border-[#e1d8cd] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-[#102117]">
                    {review.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#102117]">{review.name}</p>
                    <p className="text-xs text-slate-500">{review.time}</p>
                  </div>
                </div>
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <span key={`${review.name}-${starIdx}`} className="material-symbols-outlined text-base">
                      {starIdx < review.rating ? "grade" : "star"}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-700">{review.text}</p>
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
    <section className="relative isolate flex min-h-dvh w-full overflow-hidden bg-[#f7f3ee] text-[#142118]">
      <div className="absolute inset-0">
        <img
          src={dish.image}
          alt={dish.name}
          className="h-full w-full object-cover object-center opacity-80 saturate-75"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-[#f7f3ee]/85 to-[#f0e8dc]/85" />
        <div className="absolute inset-0 bg-white/60 mix-blend-screen" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#f7f3ee] via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-dvh w-full flex-col px-3 pb-8 pt-6 sm:px-6 lg:px-12">
        <header className="flex w-full items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-full border border-[#d9d0c4] bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#1a3528] transition hover:bg-white"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-3">
            {onCook && (
              <button
                onClick={onCook}
                className="hidden items-center gap-2 rounded-full border border-[#d9d0c4] bg-gradient-to-r from-[#10b981] via-[#0d8e63] to-[#0a6847] px-5 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-white shadow-lg transition hover:-translate-y-0.5 sm:flex"
              >
                <span className="material-symbols-outlined text-base">restaurant</span>
                Cook Swap
              </button>
            )}
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 rounded-full border border-[#d9d0c4] bg-white/80 px-5 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#1a3528] transition hover:bg-white"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              Ask OffRamp
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-between">
          <div className="flex flex-col gap-6">
            <div className="max-w-3xl drop-shadow">
              <h1 className={`${playfair.className} text-4xl font-bold leading-tight text-[#0b1d16] sm:text-5xl lg:text-7xl`}>
                {dish.name}
              </h1>
              <p className="mt-2 text-base font-light italic text-slate-600 sm:text-xl">{heroSummary}</p>
            </div>
            <div className="mt-4 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {heroChips.map((stat) => (
                <div
                  key={`${stat.title}-${stat.value}`}
                  className="flex items-center gap-4 rounded-2xl border border-[#e1d8cd] bg-gradient-to-br from-white via-[#fef9ef] to-[#f4ecdf] px-4 py-4 shadow-[0_15px_40px_rgba(15,23,15,0.08)]"
                >
                  <span
                    className={`material-symbols-outlined text-2xl ${stat.accent ? "text-amber-500" : "text-emerald-700"}`}
                  >
                    {stat.icon}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">{stat.title}</p>
                    <p className="text-lg font-semibold text-[#0f231a]">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-[#e1d8cd] bg-gradient-to-br from-white via-[#fef9ef] to-[#f4ecdf] px-5 py-4 shadow-[0_15px_40px_rgba(15,23,15,0.08)]">
              <div className="grid gap-4 sm:grid-cols-3">
                {nutritionChips.map((metric) => (
                  <div key={`${metric.title}-${metric.value}`} className="flex items-center gap-3 text-[#0f231a]">
                    <span className="material-symbols-outlined text-xl text-emerald-600">{metric.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">{metric.title}</p>
                      <p className="text-lg font-bold">{metric.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="rounded-3xl border border-[#e1d8cd] bg-white/90 backdrop-blur-xl">
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
                    className={`flex w-full min-h-[5.5rem] flex-col items-center justify-center rounded-[24px] border border-[#e1d8cd] bg-gradient-to-br from-white via-[#fef9ef] to-[#f4ecdf] text-[#102017] shadow-lg transition-all duration-300 sm:min-h-[6.5rem] ${
                      isActive ? "ring-2 ring-emerald-400/70 scale-[1.02]" : "opacity-90 hover:opacity-100"
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
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#10b981] to-[#0b8a60] text-white shadow-xl transition hover:scale-105"
          onClick={() => setChatOpen(true)}
          aria-label={`Chat about ${dish.name}`}
        >
          <span className="material-symbols-outlined text-2xl">chat_bubble</span>
        </button>
      </div>

      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} dish={dish} />
    </section>
  );
}
