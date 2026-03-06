"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DAY_LABELS: Record<string, string> = {
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
  const router = useRouter();
  const [plan, setPlan] = useState<WeekRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayName = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

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

        const res = await fetch("/api/transition/plan", {
          credentials: "include",
        });
        const json = await res.json();
        if (!active) return;
        if (json.error) setError(json.error);
        else setPlan(json.plan ?? []);
      } catch {
        if (active) setError("Failed to load plan.");
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
      <div className="mb-8">
        <h2
          className="text-4xl font-black uppercase tracking-tight sm:text-5xl"
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
        <div className="flex flex-col gap-5">
          {plan.map((row) => (
            <div
              key={row.week_number}
              className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-[#f7fbf8] to-[#eef6f1] p-5 shadow-[0_10px_28px_rgba(15,28,33,0.08)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-[0.25em] text-slate-700">
                  Week {row.week_number}
                </span>
                <span
                  className="rounded-full bg-[#f28f16] px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white"
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
                      className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                      style={{
                        backgroundColor: isSwap
                          ? "var(--color-primary)"
                          : "#f4f4f5",
                        color: isSwap ? "#fff" : "var(--color-foreground)",
                        borderColor: isSwap
                          ? "var(--color-primary)"
                          : "#e4e4e7",
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
