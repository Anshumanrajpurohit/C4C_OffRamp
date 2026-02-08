"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { GlobalNav } from "@/app/components/GlobalNav";
import { DISH_CATALOG } from "@/lib/dishes";

type SessionUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  region?: string | null;
  city?: string | null;
  budget_level?: string | null;
};

type ProfileRecord = {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  dietary_preferences?: string[] | null;
  dietary_type?: string | null;
  favorite_cuisines?: string[] | null;
  favorite_ingredients?: string[] | null;
  spice_tolerance?: string | null;
  water_saved_liters?: number | null;
  co2_reduced_kg?: number | null;
  land_saved_sqm?: number | null;
  swaps_completed?: number | null;
  swaps_growth_pct?: number | null;
  swap_series?: number[] | null;
  api_limit?: string | null;
};

type SidebarItem = {
  id: string;
  label: string;
  icon: string;
};

            <defs>
              <linearGradient id="impactSpark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline fill="none" stroke="url(#impactSpark)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" points={chartPath} />
          </svg>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          "Saved 320 liters vs avg cafeteria line",
          "2.4kg CO2 spared per serving swap",
          "12 sq m land restored via jackfruit trays",
        ].map((highlight) => (
          <div key={highlight} className="rounded-3xl border border-slate-100 bg-white px-5 py-4 text-sm text-slate-600 shadow">
            <p className="font-semibold text-slate-900">{highlight}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Taste Matrix</p>
            <h3 className="text-2xl font-black text-slate-900">Flavor priorities</h3>
          </div>
          <button
            type="button"
            onClick={() => router.push("/profile-setup")}
            className="rounded-full border-2 border-slate-200 bg-slate-50 px-5 py-3 text-[0.65rem] font-black uppercase tracking-[0.35em] text-slate-700 transition hover:-translate-y-0.5"
          >
            Update
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {preferences.cuisines.slice(0, 3).map((cuisine) => (
            <div key={cuisine} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-slate-400">Cuisine</p>
              <p className="text-2xl font-black text-slate-900">{cuisine}</p>
              <p className="mt-2 text-xs text-slate-500">Boosted this month</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Key Ingredients</p>
            <p className="text-2xl font-black text-slate-900">Pantry signals</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold text-slate-500">Chef insights</span>
        </div>
        <ul className="mt-5 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
          {preferences.ingredients.slice(0, 6).map((ingredient) => (
            <li key={ingredient} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
              {ingredient}
            </li>
          ))}
          <li className="rounded-full border border-slate-200 bg-emerald-50 px-4 py-2 text-emerald-700">
            {preferences.spice} Spice
          </li>
        </ul>
      </div>
    </div>
  );

  const renderActivitySection = () => (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.8fr,1.2fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Chef threads</p>
              <h3 className="text-2xl font-black text-slate-900">Live swaps</h3>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">Campus feed</span>
          </div>
          <div className="mt-4 space-y-4">
            {chefHighlights.map((highlight, index) => (
              <div key={`${highlight.id}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{highlight.name}</p>
                    <p className="text-xs text-slate-500">{highlight.description}</p>
                  </div>
                  <span className="text-xs text-emerald-600">{highlight.trend}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.35em] text-slate-400">
                  {highlight.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-200 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Activity timeline</p>
                <h3 className="text-2xl font-black text-slate-900">Recent swaps</h3>
              </div>
              <button
                type="button"
                onClick={() => router.push("/swap")}
                className="rounded-full border-2 border-slate-200 bg-slate-50 px-5 py-3 text-[0.65rem] font-black uppercase tracking-[0.35em] text-slate-700 transition hover:-translate-y-0.5"
              >
                Go to swaps
              </button>
            </div>
            <ul className="mt-4 space-y-4">
              {swaps.map((swap) => (
                <li key={`${swap.from}-${swap.to}`} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600">
                    <span className="material-symbols-outlined text-base">autorenew</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{swap.from}</p>
                    <p className="text-xs text-slate-500">{swap.to}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>{swap.time}</p>
                    <p className="text-emerald-600">{swap.savings}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountSection = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Account access</p>
            <h3 className="text-2xl font-black text-slate-900">Security & Sessions</h3>
          </div>
          <button
            type="button"
            onClick={() => router.push("/todos")}
            className="rounded-full border-2 border-slate-200 bg-slate-50 px-5 py-3 text-[0.65rem] font-black uppercase tracking-[0.35em] text-slate-700 transition hover:-translate-y-0.5"
          >
            Open settings
          </button>
        </div>
        <ul className="mt-4 space-y-4 text-sm text-slate-600">
          <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-900">Session token active</p>
              <p className="text-xs text-slate-500">Last refresh {lastUpdated}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border-2 border-slate-200 bg-white px-4 py-2 text-[0.6rem] font-black uppercase tracking-[0.35em] text-slate-700 transition hover:-translate-y-0.5"
            >
              Logout
            </button>
          </li>
          <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-900">Two-factor ready</p>
              <p className="text-xs text-slate-500">Send WhatsApp OTP</p>
            </div>
            <button className="rounded-full border-2 border-emerald-200 bg-emerald-50 px-4 py-2 text-[0.6rem] font-black uppercase tracking-[0.35em] text-emerald-700 transition hover:-translate-y-0.5">
              Enable
            </button>
          </li>
          <li className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-900">API limit</p>
              <p className="text-xs text-slate-500">{profile?.api_limit || "Standard"} tier</p>
            </div>
            <span className="text-xs text-slate-400">Auto scaling</span>
          </li>
        </ul>
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Support</p>
            <h3 className="text-2xl font-black text-slate-900">Need a food ops coach?</h3>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">24/7</span>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Get live help optimizing prep plans, evaluating suppliers, or rolling out new menu swaps. Our AI chefs sync with your campus data.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            "WhatsApp Concierge",
            "Book tasting lab",
            "Supplier audits",
            "Custom dashboards",
          ].map((cta) => (
            <button
              key={cta}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900"
            >
              {cta}
              <span className="material-symbols-outlined text-base text-slate-400">north_east</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSidebar) {
      case "impact":
        return renderImpactSection();
      case "preferences":
        return renderPreferencesSection();
      case "activity":
        return renderActivitySection();
      case "account":
        return renderAccountSection();
      case "profile-overview":
      default:
        return renderProfileOverview();
    }
  };

          <div>
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.5em] text-slate-400">Dashboard</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{firstName}</h2>
              <p className="text-sm text-slate-500">Track swaps, impact, and controls</p>
            </div>
            <nav className="space-y-2" aria-label="Dashboard sections">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = activeSidebar === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSidebarNavigation(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                      isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-lg ${
                          isActive ? "border-emerald-200 bg-white text-emerald-600" : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{item.icon}</span>
                      </span>
                      {item.label}
                    </span>
                    <span className={`material-symbols-outlined text-base transition ${isActive ? "text-emerald-600" : "text-slate-300"}`}>
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="space-y-5">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-[0.65rem] font-black uppercase tracking-[0.35em] text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:translate-y-0 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              {isSigningOut ? "Signing out" : "Logout"}
            </button>
          </div>
        </aside>

        <section className="flex w-full flex-1 flex-col rounded-[32px] border border-white/60 bg-white/80 shadow-[0_25px_65px_rgba(15,28,33,0.08)] backdrop-blur">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-black/5 bg-white/90 px-6 py-6 text-slate-900 shadow-[0_8px_0_rgba(0,0,0,0.04)] backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-400">Profile Control Center</p>
              <h1 className="text-2xl font-black text-slate-900">{activeSection?.label ?? "Dashboard"}</h1>
            </div>
            <div className="flex w-full gap-3 overflow-x-auto pt-1 text-[0.65rem] font-black uppercase tracking-[0.35em] lg:hidden">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={`mobile-${item.id}`}
                  type="button"
                  onClick={() => handleSidebarNavigation(item.id)}
                  className={`rounded-full border-2 px-5 py-2.5 transition ${
                    activeSidebar === item.id ? "border-black bg-[#0D5C46] text-white" : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#f4f6fb]">
            <div className="w-full px-4 pb-16 pt-8 sm:px-8 xl:px-14 2xl:px-20">{renderSection()}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
