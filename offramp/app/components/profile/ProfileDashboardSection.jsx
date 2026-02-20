"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function ProfileDashboardSection() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/progress")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      })
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2
            className="text-5xl font-black uppercase tracking-tight"
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

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/onboarding"
              className="block text-center rounded-xl py-3 font-bold uppercase tracking-widest text-sm text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Update Preferences
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
