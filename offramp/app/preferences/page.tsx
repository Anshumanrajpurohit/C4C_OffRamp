"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";

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
  { value: "easy", label: "Easy - minimal change" },
  { value: "moderate", label: "Moderate - steady progress" },
  { value: "intensive", label: "Intensive - fast transition" },
];
const WEEKS_OPTIONS = [4, 12, 24, 48];

const STEP_LABELS = [
  "Basic Preferences",
  "Constraints",
  "Budget",
  "Transition Plan",
  "Review",
];

export default function PreferencesPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    target_goal: "",
    transition_period_weeks: 12,
    baseline_nonveg_meals: 7,
    preferred_cuisine: "",
    effort_level: "",
    reminder_time: "09:00",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setAuthRequired(false);
      try {
        const sessionRes = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        if (!sessionRes.ok) {
          setAuthRequired(true);
          setLoading(false);
          router.replace("/auth");
          return;
        }
        const sessionData = await sessionRes.json();
        setUser(sessionData.user ?? null);
        const res = await fetch("/api/preferences/get", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setForm((prev) => ({ ...prev, ...data.preferences }));
          }
        }
      } catch {
        setError("Failed to load preferences.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const sessionRes = await fetch("/api/auth/session", {
        credentials: "include",
        cache: "no-store",
      });
      if (!sessionRes.ok) {
        setSubmitError("Not logged in.");
        setSubmitLoading(false);
        return;
      }
      const res = await fetch("/api/preferences/save", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_goal: form.target_goal,
          transition_period_weeks: form.transition_period_weeks,
          baseline_nonveg_meals: form.baseline_nonveg_meals,
          preferred_cuisine: form.preferred_cuisine,
          effort_level: form.effort_level,
          reminder_time: form.reminder_time,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong.");
        setSubmitLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading...</div>;
  }
  if (authRequired) {
    return (
      <div className="p-12 text-center text-gray-700">
        <p className="mb-4 font-semibold">Login required to view preferences.</p>
        <a href="/auth" className="inline-block rounded-lg bg-green-700 px-4 py-2 text-white font-bold">
          Go to login
        </a>
      </div>
    );
  }
  if (error) {
    return <div className="p-12 text-center text-red-600">{error}</div>;
  }
  if (success) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Preferences Saved!</h2>
        <p className="mb-6">Your transition plan is ready.</p>
        <a href="/dashboard" className="inline-block px-6 py-3 rounded-xl bg-green-700 text-white font-bold">Go to Dashboard</a>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-highlight px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-3xl border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="font-impact text-5xl uppercase text-black">Preferences</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">Personalize your experience in 5 quick steps.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {STEP_LABELS.map((label, i) => {
              const active = i + 1 === step;
              const complete = i + 1 < step;
              return (
                <span
                  key={label}
                  className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${
                    active
                      ? "border-black bg-accent text-white"
                      : complete
                        ? "border-black bg-slate-100 text-black"
                        : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  Step {i + 1}: {label}
                </span>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {step === 1 && (
            <section className="space-y-6">
              <h2 className="font-impact text-3xl uppercase text-black">Basic Preferences</h2>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Target Goal</label>
                <select
                  name="target_goal"
                  value={form.target_goal}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-black"
                >
                  <option value="" disabled>Select a goal...</option>
                  {TARGET_GOALS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Preferred Cuisine</label>
                <select
                  name="preferred_cuisine"
                  value={form.preferred_cuisine}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-black"
                >
                  <option value="" disabled>Select cuisine...</option>
                  {CUISINES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-6">
              <h2 className="font-impact text-3xl uppercase text-black">Constraints</h2>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Effort Level</label>
                <select
                  name="effort_level"
                  value={form.effort_level}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-black"
                >
                  <option value="" disabled>Select effort...</option>
                  {EFFORT_LEVELS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-6">
              <h2 className="font-impact text-3xl uppercase text-black">Budget</h2>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Budget (not implemented)</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500"
                  disabled
                  placeholder="Budget step placeholder"
                />
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-6">
              <h2 className="font-impact text-3xl uppercase text-black">Transition Plan</h2>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Transition Period (weeks)</label>
                <select
                  name="transition_period_weeks"
                  value={form.transition_period_weeks}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-black"
                >
                  {WEEKS_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w} weeks</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Current Non-Veg Meals per Week</label>
                <input
                  type="number"
                  name="baseline_nonveg_meals"
                  value={form.baseline_nonveg_meals}
                  onChange={handleChange}
                  min={1}
                  max={21}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Daily Reminder Time (UTC)</label>
                <input
                  type="time"
                  name="reminder_time"
                  value={form.reminder_time}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-black"
                />
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="space-y-6">
              <h2 className="font-impact text-3xl uppercase text-black">Review your preferences</h2>
              <ul className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <li><b>Target Goal:</b> {form.target_goal}</li>
                <li><b>Preferred Cuisine:</b> {form.preferred_cuisine}</li>
                <li><b>Effort Level:</b> {form.effort_level}</li>
                <li><b>Transition Period:</b> {form.transition_period_weeks} weeks</li>
                <li><b>Non-Veg Meals/Week:</b> {form.baseline_nonveg_meals}</li>
                <li><b>Reminder Time:</b> {form.reminder_time}</li>
              </ul>
              {submitError && <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{submitError}</p>}
            </section>
          )}

          {submitError && step !== 5 && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{submitError}</p>
          )}

          <div className="flex gap-4">
            {step > 1 && (
              <button type="button" onClick={prev} className="rounded-xl border-2 border-slate-300 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-600">Back</button>
            )}
            {step < 5 && (
              <button type="button" onClick={next} className="rounded-xl border-2 border-black bg-accent px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white">Next</button>
            )}
            {step === 5 && (
              <button type="submit" disabled={submitLoading} className="rounded-xl border-2 border-black bg-accent px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white disabled:opacity-60">
                {submitLoading ? "Saving..." : "Save Preferences"}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
