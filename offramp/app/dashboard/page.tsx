"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProgressData = {
  total_meals_replaced: number;
  current_week: number;
  total_weeks: number;
  baseline_nonveg_meals: number;
  transition_complete: boolean;
  completion_percentage: number;
};

type RecentSwap = {
  id: string;
  fromDish: string;
  toDish: string;
  fromCategory: string | null;
  toCategory: string | null;
  rating: number | null;
  imageUrl: string | null;
  createdAt: string;
};

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-1"
      style={{ borderColor: "var(--color-primary)", background: "var(--color-highlight)" }}
    >
      <span className="text-xs font-bold uppercase tracking-widest text-secondary">
        {label}
      </span>
      <span className="text-3xl font-black" style={{ color: "var(--color-primary)" }}>
        {value}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ProgressData | null>(null);
  const [recentSwaps, setRecentSwaps] = useState<RecentSwap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const sessionRes = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        if (!sessionRes.ok) {
          if (active) {
            setError("Login required.");
            setLoading(false);
            router.replace("/auth");
          }
          return;
        }

        const [progressRes, swapsRes] = await Promise.all([
          fetch("/api/dashboard/progress", { credentials: "include" }),
          fetch("/api/swaps/recent?limit=10", { credentials: "include" }),
        ]);

        const json = await progressRes.json();
        if (!active) return;
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }

        if (swapsRes.ok) {
          const swapsJson = await swapsRes.json();
          if (active) {
            setRecentSwaps(Array.isArray(swapsJson?.swaps) ? swapsJson.swaps : []);
          }
        }
      } catch {
        if (active) setError("Failed to load dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link href="/" className="text-sm text-secondary hover:underline mb-2 inline-block">
            ← Home
          </Link>
          <h1
            className="text-5xl font-black uppercase tracking-tight"
            style={{ fontFamily: "var(--font-impact)", color: "var(--color-primary)" }}
          >
            Dashboard
          </h1>
          <p className="text-sm text-secondary mt-1">
            Your plant-based transition progress.
          </p>
        </div>
        <Link
          href="/weekly-plan"
          className="text-sm font-bold uppercase tracking-widest rounded-xl px-4 py-2 text-white mt-1"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          Weekly Plan →
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center text-secondary py-16 text-sm">Loading…</div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-2xl bg-red-50 border border-red-300 p-6 text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          {error.includes("onboarding") && (
            <Link
              href="/onboarding"
              className="rounded-xl px-4 py-2 text-white text-sm font-bold"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Start Onboarding
            </Link>
          )}
        </div>
      )}

      {/* Data */}
      {data && !loading && (
        <div className="flex flex-col gap-6">
          {/* Completion banner */}
          {data.transition_complete && (
            <div
              className="rounded-2xl px-6 py-4 text-white font-bold text-center text-lg"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              🎉 Transition Complete! Amazing work.
            </div>
          )}

          {/* Progress bar */}
          <div className="rounded-2xl border p-5 flex flex-col gap-3" style={{ borderColor: "var(--color-primary)", background: "var(--color-highlight)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest">
                Overall Progress
              </span>
              <span
                className="text-2xl font-black"
                style={{ color: "var(--color-primary)" }}
              >
                {data.completion_percentage}%
              </span>
            </div>
            <div className="h-4 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${data.completion_percentage}%`,
                  backgroundColor: data.transition_complete
                    ? "var(--color-primary)"
                    : "var(--color-accent)",
                }}
              />
            </div>
            <p className="text-xs text-secondary">
              Week {data.current_week} of {data.total_weeks}
            </p>
          </div>

          {/* Stat grid */}
	          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Meals Replaced"
              value={data.total_meals_replaced}
            />
            <StatCard label="Current Week" value={data.current_week} />
            <StatCard
              label="Baseline / Week"
              value={data.baseline_nonveg_meals}
            />
	            <StatCard label="Total Weeks" value={data.total_weeks} />
	          </div>

          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--color-primary)", background: "var(--color-highlight)" }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Your Swaps</p>
              <span className="text-xs font-bold text-secondary">{recentSwaps.length} recent</span>
            </div>
            {recentSwaps.length === 0 ? (
              <p className="text-sm text-secondary">No swaps yet. Go to Swap and record one.</p>
            ) : (
              <div className="space-y-3">
                {recentSwaps.map((swap) => (
                  <div key={swap.id} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-3">
                    {swap.imageUrl ? (
                      <img
                        src={swap.imageUrl}
                        alt={swap.toDish}
                        className="h-12 w-12 rounded-lg border object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {swap.fromDish} → {swap.toDish}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(swap.createdAt).toLocaleString()}
                        {typeof swap.rating === "number" ? ` • Rating ${swap.rating}/5` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

	          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/dashboard/my-swaps"
              className="block text-center rounded-xl py-3 font-bold uppercase tracking-widest text-sm border-2"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
            >
              My Swaps
            </Link>
            <Link
              href="/dashboard/impact"
              className="block text-center rounded-xl py-3 font-bold uppercase tracking-widest text-sm border-2"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
            >
              Impact
            </Link>
            <Link
              href="/weekly-plan"
              className="block text-center rounded-xl py-3 font-bold uppercase tracking-widest text-sm text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              View Weekly Plan
            </Link>
            <Link
              href="/onboarding"
              className="block text-center rounded-xl py-3 font-bold uppercase tracking-widest text-sm border-2"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
            >
              Update Preferences
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

