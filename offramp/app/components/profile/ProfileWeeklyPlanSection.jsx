"use client";
import { useEffect, useState } from "react";

const DAY_LABELS = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const ALL_DAYS = Object.keys(DAY_LABELS);

type WeekRow = {
  week_number: number;
  meals_to_replace: number;
  swap_days: string[];
};

export default function ProfileWeeklyPlanSection() {
  const [plan, setPlan] = useState<WeekRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayName = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  useEffect(() => {
    fetch("/api/transition/plan")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setPlan(json.plan ?? []);
      })
      .catch(() => setError("Failed to load plan."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-6">
      <div className="mb-8">
        <h2
          className="text-5xl font-black uppercase tracking-tight"
          style={{ fontFamily: "var(--font-impact)", color: "var(--color-primary)" }}
        >
          Weekly Plan
        </h2>
        <p className="text-sm text-secondary mt-1">
          Your personalised meal-swap schedule across all weeks.
        </p>
      </div>

      {loading && (
        <div className="text-center text-secondary py-16 text-sm">Loading…</div>
      )}

      {error && !loading && (
        <div className="rounded-2xl bg-red-50 border border-red-300 p-6 text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <a
            href="/onboarding"
            className="rounded-xl px-4 py-2 text-white text-sm font-bold"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Start Onboarding
          </a>
        </div>
      )}

      {!loading && !error && plan.length === 0 && (
        <div className="text-center py-16 text-secondary text-sm">
          No plan found. <a href="/onboarding" className="underline">Complete onboarding first.</a>
        </div>
      )}

      {plan.length > 0 && (
        <div className="flex flex-col gap-4">
          {plan.map((row) => (
            <div
              key={row.week_number}
              className="rounded-2xl border p-5 flex flex-col gap-3"
              style={{
                borderColor: "var(--color-primary)",
                background: "var(--color-highlight)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--color-secondary)" }}
                >
                  Week {row.week_number}
                </span>
                <span
                  className="text-sm font-bold rounded-full px-3 py-1 text-white"
                  style={{ backgroundColor: "var(--color-accent)" }}
                >
                  {row.meals_to_replace} swap{row.meals_to_replace !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => {
                  const isSwap = row.swap_days?.includes(day);
                  const isToday = day === todayName;
                  return (
                    <span
                      key={day}
                      className="text-xs rounded-full px-3 py-1 font-semibold border"
                      style={{
                        backgroundColor: isSwap
                          ? "var(--color-primary)"
                          : "transparent",
                        color: isSwap ? "#fff" : "var(--color-foreground)",
                        borderColor: isSwap
                          ? "var(--color-primary)"
                          : "#ccc",
                        outline: isToday ? "2px solid var(--color-accent)" : "none",
                        outlineOffset: "2px",
                      }}
                    >
                      {DAY_LABELS[day]}
                      {isToday ? " ·" : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {plan.length > 0 && (
        <div className="mt-6 flex gap-4 text-xs text-secondary">
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: "var(--color-primary)" }}
            />
            Swap day
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full border border-gray-400"
            />
            Rest day
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full border-2"
              style={{ borderColor: "var(--color-accent)" }}
            />
            Today
          </span>
        </div>
      )}
    </section>
  );
}
