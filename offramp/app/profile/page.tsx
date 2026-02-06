"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavAuthButton } from "@/app/components/NavAuthButton";
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
  spice_tolerance?: string | null;
  water_saved_liters?: number | null;
  co2_reduced_kg?: number | null;
  land_saved_sqm?: number | null;
  swaps_completed?: number | null;
  swaps_growth_pct?: number | null;
  swap_series?: number[] | null;
};

type SidebarItem = {
  id: string;
  label: string;
  icon: string;
};

type ActivityEntry = {
  slug: string;
  title: string;
  subtitle: string;
  meta: string;
};

type ActivityTab = "swaps" | "saved" | "history";

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "profile-overview", label: "Profile", icon: "account_circle" },
  { id: "impact", label: "Impact", icon: "monitoring" },
  { id: "preferences", label: "Preferences", icon: "tune" },
  { id: "activity", label: "Activity", icon: "history" },
  { id: "account", label: "Account Settings", icon: "shield_lock" },
];

const FALLBACK_SERIES = [180, 210, 200, 260, 320, 340];

function toList(value?: string[] | null, fallback: string[] = []) {
  if (!value) return fallback;
  return Array.isArray(value) ? value : fallback;
}

function getAvatarUrl(profile?: ProfileRecord | null) {
  if (profile?.avatar_url) return profile.avatar_url;
  return "/c4c.webp";
}

export default function ProfileDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSidebar, setActiveSidebar] = useState<string>(SIDEBAR_ITEMS[0].id);
  const [activityTab, setActivityTab] = useState<ActivityTab>("swaps");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
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
    const spice = profile?.spice_tolerance ?? "Medium";
    return { dietList, cuisines, spice };
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

  const activityByTab = useMemo(() => {
    const dishes = DISH_CATALOG.slice(0, 6);
    const swaps: ActivityEntry[] = dishes.slice(0, 3).map((dish, index) => ({
      slug: dish.slug,
      title: dish.name,
      subtitle: `Swapped for ${dish.replaces?.[0] ?? "classic"}`,
      meta: index === 0 ? "2 hours ago" : index === 1 ? "Yesterday" : "Last week",
    }));
    const saved: ActivityEntry[] = dishes.slice(3, 6).map((dish, index) => ({
      slug: dish.slug,
      title: dish.name,
      subtitle: "Saved to board",
      meta: index === 0 ? "Today" : "Earlier this week",
    }));
    const history: ActivityEntry[] = dishes.map((dish, index) => ({
      slug: dish.slug,
      title: dish.name,
      subtitle: "Viewed impact report",
      meta: `${index + 2} days ago`,
    }));
    return { swaps, saved, history };
  }, []);

  const displayName = user?.full_name?.trim() && user.full_name.length > 0 ? user.full_name : "OffRamp Member";
  const email = user?.email ?? "";

  const handleSidebarNavigation = (sectionId: string) => {
    setActiveSidebar(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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

  const primaryBadge = preferences.dietList[0] ?? "Vegan";

  return (
    <main className="min-h-screen bg-[#eef2ef] text-slate-900">
      <nav className="border-b-3 border-black bg-highlight/90 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="group flex items-center gap-2">
            <img
              src="/c4c.webp"
              alt="OffRamp logo"
              className="h-10 w-10 rounded border-2 border-black bg-white object-cover transition-transform duration-300 group-hover:rotate-6"
            />
            <span className="font-impact text-3xl uppercase tracking-wide text-black">OffRamp</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-bold uppercase tracking-wider md:flex">
            <Link
              href="/swap"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Swap
            </Link>
            <Link
              href="/#impact"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Impact
            </Link>
            <Link
              href="/preferences"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Preferences
            </Link>
          </div>
          <NavAuthButton userHref="/profile" />
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:w-64 lg:shrink-0 lg:sticky lg:top-8">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
            <div className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSidebarNavigation(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    activeSidebar === item.id ? "bg-[#e3f1e8] text-[#1e4f35]" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-6 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black bg-black px-4 py-2 text-sm font-bold uppercase text-white transition hover:-translate-y-[1px] hover:bg-accent disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                {isSigningOut ? "Signing out" : "Logout"}
              </button>
            </div>
          </aside>

          <div className="flex-1 space-y-6">
            <section id="profile-overview" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <Image
                      src={getAvatarUrl(profile)}
                      alt={displayName}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                    <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                      {primaryBadge}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Zero waste pro</p>
                    <h1 className="text-2xl font-black text-[#1e3426]">{displayName}</h1>
                    <p className="text-sm text-slate-500">{email}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-[#2f6b4a]">
                      {preferences.dietList.slice(0, 2).map((diet) => (
                        <span key={diet} className="rounded-full bg-[#e3f1e8] px-3 py-1">
                          {diet}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-sm text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Location</p>
                    <p className="text-base font-semibold text-slate-800">{user?.city || "Remote"}, {user?.region || "Global"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/profile-setup")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#2f6b4a] bg-white px-4 py-2 text-sm font-bold uppercase text-[#2f6b4a] transition hover:-translate-y-[1px] hover:bg-[#2f6b4a] hover:text-white"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    Edit Profile
                  </button>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Diet tier", value: primaryBadge },
                  {
                    label: "Budget focus",
                    value: user?.budget_level ? user.budget_level : "Standard",
                  },
                  { label: "Favorite cuisine", value: preferences.cuisines[0] },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                    <p className="text-lg font-semibold text-[#1e4f35]">{card.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="impact" className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1.1fr,0.9fr]">
              <div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Water Saved", value: impactMetrics.water, unit: "Liters", trend: "+12%" },
                    { label: "CO2 Reduced", value: impactMetrics.co2, unit: "kg", trend: "+8%" },
                    { label: "Land Saved", value: impactMetrics.land, unit: "Sq M", trend: "+5%" },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        <span>{metric.label}</span>
                        <span className="text-emerald-600">{metric.trend}</span>
                      </div>
                      <p className="text-3xl font-black text-[#1e3426]">{metric.value.toLocaleString()}</p>
                      <p className="text-xs font-semibold text-slate-500">{metric.unit}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-3xl border border-slate-100 bg-gradient-to-br from-[#e3f1e8] to-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Swaps over time</p>
                      <p className="text-3xl font-black text-[#1e3426]">{impactMetrics.swaps.toLocaleString()}</p>
                      <p className="text-xs font-semibold text-emerald-600">{impactMetrics.growth}% growth last 6 months</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">Live</span>
                  </div>
                  <svg viewBox="0 0 100 100" className="mt-6 h-28 w-full text-emerald-500">
                    <defs>
                      <linearGradient id="impactLine" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="none"
                      stroke="url(#impactLine)"
                      strokeWidth={3}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={chartPath}
                    />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Impact highlights</p>
                    <h3 className="text-xl font-black text-[#1e3426]">This week</h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">Updated</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <span className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
                      <span className="material-symbols-outlined text-base">water</span>
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Saved 320 liters</p>
                      <p className="text-xs text-slate-500">vs avg cafeteria line</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <span className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
                      <span className="material-symbols-outlined text-base">forest</span>
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">12 sq m land restored</p>
                      <p className="text-xs text-slate-500">Thanks to jackfruit swaps</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <span className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
                      <span className="material-symbols-outlined text-base">ecg</span>
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">15% conversion lift</p>
                      <p className="text-xs text-slate-500">Students picking veg trays</p>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            <section id="preferences" className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[0.9fr,1.1fr]">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">User preferences</p>
                    <h3 className="text-xl font-black text-[#1e3426]">Dietary type</h3>
                  </div>
                  <Link
                    href="/preferences"
                    className="text-sm font-semibold text-[#2f6b4a] hover:underline"
                  >
                    Manage
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#2f6b4a]">
                  {preferences.dietList.map((diet) => (
                    <span key={diet} className="rounded-full bg-white px-3 py-1 shadow-sm">
                      {diet}
                    </span>
                  ))}
                </div>
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Spice tolerance</p>
                  <div className="mt-2 flex gap-2 text-xs font-bold">
                    {["Mild", "Medium", "Hot"].map((level) => (
                      <span
                        key={level}
                        className={`rounded-full px-3 py-1 ${
                          level === preferences.spice ? "bg-[#2f6b4a] text-white" : "bg-white text-slate-500"
                        }`}
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Favorite cuisines</p>
                    <h3 className="text-xl font-black text-[#1e3426]">Saved sets</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/profile-setup#cuisines")}
                    className="text-sm font-semibold text-[#2f6b4a] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#2f6b4a]">
                  {preferences.cuisines.map((cuisine) => (
                    <span key={cuisine} className="rounded-full bg-white px-3 py-1 shadow-sm">
                      {cuisine}
                    </span>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-[#1e3426]">Need to refresh your intake?</p>
                  <p className="text-xs text-slate-500">Re-run the guided setup to sync with pantry spends.</p>
                </div>
              </div>
            </section>

            <section id="activity" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Activity hub</p>
                  <h3 className="text-2xl font-black text-[#1e3426]">Latest moves</h3>
                </div>
                <div className="flex gap-2 rounded-full bg-slate-50 p-1 text-xs font-bold text-slate-500">
                  {(["swaps", "saved", "history"] as ActivityTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActivityTab(tab)}
                      className={`rounded-full px-3 py-1 ${
                        activityTab === tab ? "bg-white text-[#1e3426] shadow" : ""
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {activityByTab[activityTab].map((activity) => (
                  <div key={`${activityTab}-${activity.slug}`} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#1e3426]">{activity.title}</p>
                      <p className="text-xs text-slate-500">{activity.subtitle}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1">
                        <span className="material-symbols-outlined text-base text-emerald-500">visibility</span>
                        {activity.meta}
                      </span>
                      <Link
                        href={`/swap?demo=1#${activity.slug}`}
                        className="inline-flex items-center gap-1 rounded-full border-2 border-[#2f6b4a] px-3 py-1 text-[#2f6b4a]"
                      >
                        View
                        <span className="material-symbols-outlined text-base">north_east</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  href="/swap"
                  className="text-sm font-semibold text-[#2f6b4a] hover:underline"
                >
                  View more activity
                </Link>
              </div>
            </section>

            <section id="account" className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <h3 className="text-lg font-black text-[#1e3426]">Security & Controls</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                    <div>
                      <p className="font-semibold text-[#1e3426]">Change password</p>
                      <p className="text-xs text-slate-500">Updated 3 months ago</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/auth")}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      Manage
                    </button>
                  </li>
                  <li className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                    <div>
                      <p className="font-semibold text-[#1e3426]">Notifications</p>
                      <p className="text-xs text-slate-500">Email and push</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsEnabled((prev) => !prev)}
                      className={`flex h-8 w-14 items-center rounded-full px-1 ${
                        notificationsEnabled ? "bg-[#2f6b4a]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`h-6 w-6 rounded-full bg-white transition ${
                          notificationsEnabled ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </li>
                  <li className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                    <div>
                      <p className="font-semibold text-[#1e3426]">Data & privacy</p>
                      <p className="text-xs text-slate-500">Manage your footprint</p>
                    </div>
                    <Link
                      href="/profile-setup"
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      Review
                    </Link>
                  </li>
                  <li className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                    <div>
                      <p className="font-semibold text-[#b42318]">Sign out all devices</p>
                      <p className="text-xs text-slate-500">Recommended after shared kiosk use</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-full border border-[#b42318] px-3 py-1 text-xs font-semibold text-[#b42318]"
                    >
                      Sign out
                    </button>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <h3 className="text-lg font-black text-[#1e3426]">Support</h3>
                <p className="text-sm text-slate-600">Need a concierge for institutional rollouts? Reach out.</p>
                <div className="mt-4 space-y-3 text-sm font-semibold text-[#2f6b4a]">
                  <a href="mailto:hello@offramp.ai" className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <span className="material-symbols-outlined text-base">mail</span>
                    hello@offramp.ai
                  </a>
                  <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <span className="material-symbols-outlined text-base">chat</span>
                    Connect on LinkedIn
                  </a>
                  <Link href="/whatsapp" className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <span className="material-symbols-outlined text-base">support_agent</span>
                    WhatsApp assistant
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <footer className="border-t-3 border-black bg-white px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 md:flex-row">
          <div className="group flex items-center gap-2">
            <img
              src="/c4c.webp"
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
            © 2024 C4C OFFRAMP. BE BOLD. EAT WELL.
          </div>
        </div>
      </footer>
    </main>
  );
}
