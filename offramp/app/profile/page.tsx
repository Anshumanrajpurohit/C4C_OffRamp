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

type SwapEntry = {
  from: string;
  to: string;
  time: string;
  savings: string;
};

type ChefHighlight = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  trend: string;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "profile-overview", label: "Profile", icon: "account_circle" },
  { id: "impact", label: "Impact", icon: "monitoring" },
  { id: "preferences", label: "Preferences", icon: "tune" },
  { id: "activity", label: "Activity", icon: "history" },
  { id: "account", label: "Settings", icon: "shield_lock" },
];

const FALLBACK_SERIES = [180, 210, 200, 260, 320, 340];

function toList(value?: string[] | null, fallback: string[] = []) {
  if (!value) return fallback;
  return Array.isArray(value) ? value : fallback;
}

function getAvatarUrl(profile?: ProfileRecord | null) {
 
  if (profile?.avatar_url) return profile.avatar_url;
  return "/offramp-logo.png";
 
  return profile?.avatar_url || "/c4c.webp";

}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSidebar, setActiveSidebar] = useState<string>(SIDEBAR_ITEMS[0].id);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });

        const sessionPayload = await sessionResponse.json();

        if (!sessionPayload?.user) {
          router.replace("/auth");
          return;
        }

        if (!isMounted) return;
        setUser(sessionPayload.user);

        const profileResponse = await fetch("/api/profile", {
          credentials: "include",
          cache: "no-store",
        });

        if (profileResponse.status === 401) {
          router.replace("/auth");
          return;
        }

        if (!isMounted) return;

        if (profileResponse.ok) {
          const profilePayload = await profileResponse.json();
          if (isMounted) {
            setProfile(profilePayload.profile ?? null);
          }
        }
      } catch (error) {
        console.error("Failed to load profile dashboard", error);
        router.replace("/auth");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const preferences = useMemo(() => {
    const dietList = toList(profile?.dietary_preferences, profile?.dietary_type ? [profile.dietary_type] : ["Vegan"]);
    const cuisines = toList(profile?.favorite_cuisines, ["Italian", "Japanese", "Thai"]);
    const ingredients = toList(profile?.favorite_ingredients, ["Jackfruit protein", "Millet dosa", "Kombucha glaze", "Cashew crema"]);
    const spice = profile?.spice_tolerance ?? "Medium";
    return { dietList, cuisines, ingredients, spice };
  }, [profile]);

  const impactMetrics = useMemo(() => {
    return {
      water: profile?.water_saved_liters ?? 1250,
      co2: profile?.co2_reduced_kg ?? 45,
      land: profile?.land_saved_sqm ?? 12,
      swaps: profile?.swaps_completed ?? 324,
      growth: profile?.swaps_growth_pct ?? 15,
      series: (profile?.swap_series && profile.swap_series.length > 1 ? profile.swap_series : FALLBACK_SERIES).slice(0, 6),
    };
  }, [profile]);

  const chartPath = useMemo(() => {
    const { series } = impactMetrics;
    if (!series.length) return "";

    const max = Math.max(...series);
    const min = Math.min(...series);
    const span = max - min || 1;

    return series
      .map((value, index) => {
        const x = (index / (series.length - 1 || 1)) * 100;
        const normalized = (value - min) / span;
        const y = 90 - normalized * 70;
        return `${x},${y}`;
      })
      .join(" ");
  }, [impactMetrics]);

  const swaps = useMemo<SwapEntry[]>(() => {
    const dishes = DISH_CATALOG.slice(0, 4);
    const labels = ["3h ago", "Yesterday", "2 days ago", "Last week"];
    return dishes.map((dish, index) => ({
      from: dish.replaces?.[0] ?? "Standard meal",
      to: dish.name,
      time: labels[index] ?? "Recently",
      savings: `-${5 + index * 3}% cost`,
    }));
  }, []);

  const chefHighlights = useMemo<ChefHighlight[]>(() => {
    return DISH_CATALOG.slice(0, 3).map((dish, index) => {
      const baseline = ((dish.name.length + index * 7) % 10) + 5;
      return {
        id: dish.id,
        name: dish.name,
        description: dish.hotSwaps?.[0] ? `Swap from ${dish.hotSwaps[0]} to ${dish.name}` : "Chef special",
        tags: dish.tags?.slice(0, 2) ?? [],
        trend: `+${baseline}%`,
      };
    });
  }, []);

  const lastUpdated = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const displayName = user?.full_name?.trim() && user.full_name.length > 0 ? user.full_name : "OffRamp Member";
  const email = user?.email ?? "";
  const primaryBadge = preferences.dietList[0] ?? "Vegan";
  const firstName = (displayName.split(" ")[0] ?? "Member").trim() || "Member";

  const quickFacts = [
    { label: "Diet Type", value: primaryBadge, icon: "restaurant" },
    { label: "Budget Focus", value: user?.budget_level || "Standard", icon: "account_balance_wallet" },
    { label: "Cuisine", value: preferences.cuisines[0], icon: "room" },
  ];

  const activeSection = SIDEBAR_ITEMS.find((item) => item.id === activeSidebar);

  const handleSidebarNavigation = (sectionId: string) => {
    setActiveSidebar(sectionId);
  };

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/auth");
    } catch (error) {
      console.error("Failed to log out", error);
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] text-[#0f1c21]">
        <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Loading profile...</span>
      </div>
    );
  }

  const renderProfileOverview = () => (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/60 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-6">
            <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
              <Image src={getAvatarUrl(profile)} alt={displayName} fill sizes="96px" className="object-cover" />
              <span className="absolute -bottom-2 -right-2 rounded-2xl bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.4em] text-white">
                {primaryBadge}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-bold text-slate-900">{displayName}</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Zero Waste Pro
                </span>
              </div>
              <p className="text-sm text-slate-500">{email}</p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                {preferences.dietList.slice(0, 3).map((diet) => (
                  <span key={diet} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    {diet}
                   </span>
                 ))}
               </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm text-slate-500">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Location</p>
              <p className="text-base font-semibold text-slate-900">
                {user?.city || "Remote"}, {user?.region || "Global"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/profile-setup")}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-[0.65rem] font-black uppercase tracking-[0.35em] text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => router.push("/profile-setup")}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-6 py-4 text-[0.65rem] font-black uppercase tracking-[0.35em] text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                Preferences
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickFacts.map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">{card.label}</p>
              <span className="material-symbols-outlined text-base text-slate-300">{card.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Water Saved", value: `${impactMetrics.water.toLocaleString()} Liters`, trend: "+12%" },
          { label: "CO2 Reduced", value: `${impactMetrics.co2.toLocaleString()} kg`, trend: "+8%" },
          { label: "Land Saved", value: `${impactMetrics.land.toLocaleString()} Sq M`, trend: "+5%" },
        ].map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">
              <span>{metric.label}</span>
              <span className="text-emerald-600">{metric.trend}</span>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">Recent swaps</p>
            <p className="text-lg font-bold text-slate-900">Latest activity from your campus</p>
          </div>
          <button className="rounded-full border-2 border-slate-900/20 px-6 py-3 text-[0.65rem] font-black uppercase tracking-[0.35em] text-slate-700 transition hover:-translate-y-0.5">View all</button>
        </div>
        <ul className="mt-5 space-y-3">
          {swaps.map((swap) => (
            <li key={`${swap.from}-${swap.to}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{swap.to}</p>
                <p className="text-xs text-slate-500">Swapped for {swap.from}</p>
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
  );

  const renderImpactSection = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Impact Dashboard</p>
            <h3 className="text-2xl font-black text-slate-900">Sustainable gains</h3>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold text-slate-500">Live sync</span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { label: "Water Saved", value: `${impactMetrics.water.toLocaleString()} Liters`, trend: "+12%" },
            { label: "CO2 Reduced", value: `${impactMetrics.co2.toLocaleString()} kg`, trend: "+8%" },
            { label: "Land Saved", value: `${impactMetrics.land.toLocaleString()} Sq M`, trend: "+5%" },
          ].map((metric) => (
            <div key={metric.label} className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
                <span>{metric.label}</span>
                <span className="text-emerald-600">{metric.trend}</span>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">{metric.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-3xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Swaps over time</p>
              <p className="text-4xl font-black text-slate-900">{impactMetrics.swaps.toLocaleString()}</p>
              <p className="text-xs font-semibold text-emerald-600">+{impactMetrics.growth}% vs last 6 months</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-600">Updated {lastUpdated}</span>
          </div>
          <svg viewBox="0 0 100 100" className="mt-6 h-32 w-full text-emerald-500">
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
            {chefHighlights.map((highlight, index) => {
              return (
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
              );
            })}
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

  return (
 
    <main className="min-h-screen bg-[#eef2ef] text-slate-900">
 
      <nav className="border-b-3 border-black bg-highlight/90 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="group flex items-center gap-2">
            <img
              src="/offramp-logo.png"
              alt="OffRamp logo"
              className="h-10 w-10 rounded border-2 border-black bg-white object-cover transition-transform duration-300 group-hover:rotate-6"
            />
            <span className="font-impact text-3xl uppercase tracking-wide text-black">OffRamp</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-bold uppercase tracking-wider md:flex">
            <div className="relative group">
              <Link
                href="/#home"
                className="relative flex items-center gap-1 transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
              >
                Home
                <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:rotate-180">
                  expand_more
                </span>
              </Link>
              <div className="absolute left-0 top-full z-20 mt-3 hidden min-w-[360px] rounded-2xl border-2 border-black bg-white px-2 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:block">
                <div className="absolute -top-3 left-0 right-0 h-3" />
                <div className="grid grid-cols-4 gap-2 divide-x divide-black/10">
                  <Link
                    href="/#how-it-works"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">home</span>
                    <span>How it Works</span>
                  </Link>
                  <Link
                    href="/#features"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">auto_graph</span>
                    <span>Features</span>
                  </Link>
                  <Link
                    href="/#impact"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">insights</span>
                    <span>Impact</span>
                  </Link>
                  <Link
                    href="/#institutions"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">apartment</span>
                    <span>Institutions</span>
                  </Link>
                </div>
              </div>
            </div>
            <Link
              href="/swap"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Food Swap
            </Link>
            <Link
              href="/#coming-soon"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Coming Soon
            </Link>
            <Link
              href="/#about"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              About
            </Link>
          </div>
          <NavAuthButton userHref="/profile" />
        </div>
      </nav>

 

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full rounded-[36px] border border-[#dfe7e1] bg-gradient-to-b from-white/95 via-[#f6faf7] to-[#eef5f0] p-6 text-slate-800 shadow-[0_28px_80px_rgba(19,41,29,0.08)] lg:w-72 lg:shrink-0 lg:sticky lg:top-8">
            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-400">Dashboard</p>
              <p className="mt-2 text-lg font-black text-[#1e4f35]">{displayName.split(" ")[0] ?? "Member"}</p>
              <p className="text-xs text-slate-500">Track swaps, impact, and controls</p>
 
    <div className="flex min-h-screen w-full flex-col bg-[#eef2eb] text-[#0f1c21]">
      <GlobalNav />

      <div className="flex flex-1 items-start gap-6 px-4 pb-10 pt-6 sm:px-8 xl:px-12">
        <aside className="hidden w-72 flex-shrink-0 flex-col justify-between rounded-[32px] border border-slate-100 bg-white/90 p-6 text-slate-900 shadow-[12px_12px_45px_rgba(15,28,33,0.08)] backdrop-blur lg:flex lg:sticky lg:top-6 lg:min-h-[calc(100vh-3rem)] lg:self-start">
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
                      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-lg ${
                        isActive ? "border-emerald-200 bg-white text-emerald-600" : "border-slate-200 bg-white text-slate-400"
                      }`}>
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
 
        </div>
      </section>

      <footer className="border-t-3 border-black bg-white px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 md:flex-row">
          <div className="group flex items-center gap-2">
            <img
              src="/offramp-logo.png"
              alt="OffRamp logo"
              className="h-10 w-10 rounded border-2 border-black bg-white object-cover transition-transform duration-300 group-hover:rotate-6"
            />
            <span className="font-impact text-4xl uppercase">OffRamp</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-black uppercase tracking-widest">
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              Privacy
            </a>
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              Terms
            </a>
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              LinkedIn
            </a>
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              Contact
            </a>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            © 2026 OFFRAMP. BE BOLD. EAT WELL.
          </div>
        </div>
      </footer>
    </main>
 
        </section>
      </div>
    </div>

  );
}
