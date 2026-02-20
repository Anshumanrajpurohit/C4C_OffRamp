"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TARGET_GOALS = [
  { value: "reduce_meat", label: "Reduce Meat Intake" },
  { value: "vegetarian", label: "Go Vegetarian" },
  { value: "vegan", label: "Go Fully Vegan" },
  { value: "flexitarian", label: "Become Flexitarian" },
];

const CUISINES = [
  { value: "indian", label: "Indian" },
  { value: "chinese", label: "Chinese" },
  { value: "continental", label: "Continental" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "mexican", label: "Mexican" },
  { value: "thai", label: "Thai" },
];

const EFFORT_LEVELS = [
  { value: "easy", label: "Easy — minimal change" },
  { value: "moderate", label: "Moderate — steady progress" },
  { value: "intensive", label: "Intensive — fast transition" },
];

const WEEKS_OPTIONS = [4, 12, 24, 48];

type FormState = {
  target_goal: string;
  transition_period_weeks: number;
  baseline_nonveg_meals: number;
  preferred_cuisine: string;
  effort_level: string;
  reminder_time: string;
};

export default function OnboardingPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    target_goal: "",
    transition_period_weeks: 12,
    baseline_nonveg_meals: 7,
    preferred_cuisine: "",
    effort_level: "",
    reminder_time: "09:00",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "transition_period_weeks" || name === "baseline_nonveg_meals"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/preferences/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-secondary hover:underline mb-4 inline-block"
          >
            ← Back to home
          </Link>
          <h1
            className="text-4xl font-black uppercase tracking-tight mb-2"
            style={{ fontFamily: "var(--font-impact)", color: "var(--color-primary)" }}
          >
            Your Transition
          </h1>
          <p className="text-secondary text-sm">
            Tell us about your diet goals. We'll generate a personalised weekly
            swap plan.
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border-3 border-foreground bg-highlight p-6 flex flex-col gap-5"
          style={{ borderColor: "var(--color-primary)" }}
        >
          {/* Target goal */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest">
              Target Goal
            </label>
            <select
              name="target_goal"
              value={form.target_goal}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ focusRingColor: "var(--color-primary)" } as React.CSSProperties}
            >
              <option value="" disabled>
                Select a goal…
              </option>
              {TARGET_GOALS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Transition period */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest">
              Transition Period
            </label>
            <select
              name="transition_period_weeks"
              value={form.transition_period_weeks}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
            >
              {WEEKS_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w} weeks
                </option>
              ))}
            </select>
          </div>

          {/* Baseline meals */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest">
              Current Non-Veg Meals per Week
            </label>
            <input
              type="number"
              name="baseline_nonveg_meals"
              value={form.baseline_nonveg_meals}
              onChange={handleChange}
              min={1}
              max={21}
              required
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          {/* Preferred cuisine */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest">
              Preferred Cuisine
            </label>
            <select
              name="preferred_cuisine"
              value={form.preferred_cuisine}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="" disabled>
                Select cuisine…
              </option>
              {CUISINES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Effort level */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest">
              Effort Level
            </label>
            <select
              name="effort_level"
              value={form.effort_level}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="" disabled>
                Select effort…
              </option>
              {EFFORT_LEVELS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reminder time */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest">
              Daily Reminder Time (UTC)
            </label>
            <input
              type="time"
              name="reminder_time"
              value={form.reminder_time}
              onChange={handleChange}
              required
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm rounded-lg bg-red-50 px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl font-bold py-3 text-white text-sm uppercase tracking-widest transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? "Saving…" : "Build My Plan →"}
          </button>
        </form>
      </div>
    </main>
  );
}
