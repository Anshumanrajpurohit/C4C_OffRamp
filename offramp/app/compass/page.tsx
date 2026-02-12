"use client";

import Link from "next/link";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import PrimaryCTAButton from "@/app/components/PrimaryCTAButton";
import { GlobalNav } from "@/app/components/GlobalNav";
import SiteFooter from "@/app/components/SiteFooter";

const impact = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-impact" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

type PathTier = {
  id: string;
  name: string;
  badge: string;
  tone: "beginner" | "moderate" | "impact" | "lifestyle" | "enterprise";
  description: string;
  highlights: string[];
  ctaLabel: string;
  href: string;
  recommended?: boolean;
};

const toneStyles: Record<PathTier["tone"], { badge: string; accent: string; border: string }> = {
  beginner: {
    badge: "bg-[#e8f4ff] text-[#0f5fb9]",
    accent: "text-[#0f5fb9]",
    border: "border-[#d6e8ff]",
  },
  moderate: {
    badge: "bg-[#e9f9ee] text-[#2f8f57]",
    accent: "text-[#2f8f57]",
    border: "border-[#d3f1dc]",
  },
  impact: {
    badge: "bg-[#fff1e6] text-[#ff6a2f]",
    accent: "text-[#ff6a2f]",
    border: "border-[#ffd9c0]",
  },
  lifestyle: {
    badge: "bg-[#f0ecff] text-[#7048e8]",
    accent: "text-[#7048e8]",
    border: "border-[#d8cdfc]",
  },
  enterprise: {
    badge: "bg-[#eef3f7] text-[#0f2d40]",
    accent: "text-[#0f2d40]",
    border: "border-[#d9e4ec]",
  },
};

const PATHS: PathTier[] = [
   {
    id: "starter",
    name: "The Starter",
    badge: "Free • Beginner Friendly",
    tone: "beginner",
    description:
      "New here? No pressure. Try one simple plant-based meal a week and build the habit slowly.",
    highlights: [
      "Free Weekly Recipes",
      "Easy Grocery Lists",
      "Basic Impact Tracking",
      "Open Community Support"
    ],
    ctaLabel: "Start Free",
    href: "/swap?demo=1"
  },

  {
    id: "flex",
    name: "Flex Helper",
    badge: "Free • Balanced",
    tone: "moderate",
    description:
      "Cut down meat at your own pace. Swap meals without changing your whole life overnight.",
    highlights: [
      "3 Guided Swaps Per Week",
      "Smart Grocery Suggestions",
      "Simple Carbon Savings Tracker",
      "Taste & Texture-Based Alternatives"
    ],
    ctaLabel: "Continue Free",
    href: "/swap?demo=2"
  },

  {
    id: "guided",
    name: "Guided Transition",
    badge: "Free • Supported",
    tone: "impact",
    description:
      "Want more structure? Follow a step-by-step plan with daily tips, meal ideas, and friendly guidance.",
    highlights: [
      "Daily Meal Ideas",
      "Nutrition Tips & FAQs",
      "Progress & Habit Tracking",
      "Restaurant & Label Scanner",
      "Community Mentors"
    ],
    ctaLabel: "Start Guided Plan",
    href: "/swap?demo=3",
    recommended: true
  },

  {
    id: "vegetarian",
    name: "Vegetarian Support",
    badge: "Free • Lifestyle",
    tone: "lifestyle",
    description:
      "Going meat-free? We’ll help you balance protein, find alternatives, and shop smarter.",
    highlights: [
      "Cheese & Dairy Alternatives Guide",
      "Protein Balance Calculator",
      "Ethical Product Suggestions",
      "Local Market Finder"
    ],
    ctaLabel: "Get Support",
    href: "/swap?demo=4"
  }
//   {
//     id: "campus-corp",
//     name: "Campus & Corp",
//     badge: "Enterprise",
//     tone: "enterprise",
//     description: "Bulk solutions for organizations and large groups.",
//     highlights: ["Menu Optimization", "Inventory Sync", "Aggregate ESG Reports", "Org Analytics Dashboard"],
//     ctaLabel: "Contact Sales",
//     href: "/coming-soon",
//   },
];

export default function CompassPage() {
  return (
    <main className={`${jakarta.className} ${impact.variable} bg-highlight min-h-screen text-slate-900`}>
      <GlobalNav />

      <section className="relative px-6 pb-20 pt-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-primary">Compass</p>
          <h1 className="font-impact text-5xl leading-tight text-black md:text-6xl lg:text-7xl">
            Choose your <span className="text-accent">transition path</span>
          </h1>
          <p className="max-w-3xl text-lg font-medium text-slate-700">
            Structured behavioral onboarding that matches users with a personalized dietary transition pathway using guided choices and progressive commitment.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
              <span className="material-symbols-outlined text-sm text-primary">psychology</span>
              Behavioral cues baked in
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
              <span className="material-symbols-outlined text-sm text-primary">radar</span>
              Progressive commitment
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
              <span className="material-symbols-outlined text-sm text-primary">auto_graph</span>
              Track momentum
            </span>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-1">
          {PATHS.map((path) => {
            const tone = toneStyles[path.tone];
            return (
              <div
                key={path.id}
                className={`relative flex h-full flex-col justify-between rounded-[28px] border-3 bg-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.16)] ${tone.border}`}
              >
                {path.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white">
                    Recommended
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  <span className={`self-start rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] ${tone.badge}`}>
                    {path.badge}
                  </span>
                  <h2 className="font-impact text-2xl uppercase text-black">{path.name}</h2>
                  <p className="text-sm font-semibold text-slate-600">{path.description}</p>
                  <ul className="space-y-2 text-sm font-semibold text-slate-700">
                    {path.highlights.map((item) => (
                      <li key={`${path.id}-${item}`} className="flex items-start gap-2">
                        <span className={`material-symbols-outlined text-base ${tone.accent}`}>check_circle</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <Link
                    href={path.href}
                    prefetch={false}
                    className="text-xs font-black uppercase tracking-[0.25em] text-primary underline decoration-2 decoration-primary/60 underline-offset-4 transition hover:text-black"
                  >
                    Learn more
                  </Link>
                  <PrimaryCTAButton as={Link} href={path.href} variant={path.tone === "enterprise" ? "ghost" : "default"}>
                    {path.ctaLabel}
                  </PrimaryCTAButton>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-14 flex max-w-4xl flex-col items-center gap-4 rounded-3xl border-3 border-black bg-black px-6 py-8 text-center text-white shadow-[10px_10px_0px_0px_rgba(0,0,0,0.35)]">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/70">Why Compass</p>
          <h3 className="font-impact text-3xl uppercase md:text-4xl">Structured onboarding meets choice architecture</h3>
          <p className="max-w-3xl text-base font-semibold text-white/85">
            We guide every user through small, confidence-building commitments, surface the right swap playbooks, and keep momentum with nudges that respect culture, taste, and budgets.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
              <span className="material-symbols-outlined text-base">flag</span>
              Path scoring
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
              <span className="material-symbols-outlined text-base">bolt</span>
              Micro-commitments
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
              <span className="material-symbols-outlined text-base">group</span>
              Team rollouts
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
              <span className="material-symbols-outlined text-base">payments</span>
              Budget-aware journeys
            </span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
