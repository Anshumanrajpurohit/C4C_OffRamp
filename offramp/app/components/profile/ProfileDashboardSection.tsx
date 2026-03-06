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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex h-full min-h-[132px] flex-col justify-between rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-[#f7fbf8] to-[#eef6f1] p-5 shadow-[0_10px_28px_rgba(15,28,33,0.08)]">
      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
        {label}
      </span>
      <span className="text-4xl font-black leading-none" style={{ color: "var(--color-primary)" }}>
        {value}
      </span>
    </div>
  );
}

export default function ProfileDashboardSection() {
  const router = useRouter();
  const [data, setData] = useState<ProgressData | null>(null);
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

        const res = await fetch("/api/dashboard/progress", {
          credentials: "include",
        });
        const json = await res.json();
        if (!active) return;
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
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
    <section className="space-y-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_16px_44px_rgba(15,28,33,0.08)] sm:p-6 lg:p-7">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h2
            className="text-4xl font-black uppercase tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-impact)", color: "var(--color-primary)" }}
          >
            Dashboard
          </h2>
          <p className="text-sm text-secondary mt-1">
            Your plant-based transition progress.
          </p>
        </div>
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
          <div className="rounded-3xl border border-emerald-100 bg-[#f4fbf7] p-5 shadow-[0_8px_24px_rgba(15,28,33,0.06)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
                Overall Progress
              </span>
              <span
                className="text-3xl font-black"
                style={{ color: "var(--color-primary)" }}
              >
                {data.completion_percentage}%
              </span>
            </div>
            <div className="h-3.5 overflow-hidden rounded-full bg-slate-200">
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Week {data.current_week} of {data.total_weeks}
            </p>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/profile-setup"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-black bg-black px-5 py-3 text-center text-xs font-black uppercase tracking-[0.25em] text-white transition hover:-translate-y-0.5 hover:bg-accent"
            >
              Update Preferences
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
