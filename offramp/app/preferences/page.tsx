
"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

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

const STEP_LABELS = [
  "Basic Preferences",
  "Constraints",
  "Budget",
  "Transition Plan",
  "Review",
];

const API_BASE = process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:4000";

export default function PreferencesPage() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // All form fields (across steps)
  const [form, setForm] = useState({
    target_goal: "",
    transition_period_weeks: 12,
    baseline_nonveg_meals: 7,
    preferred_cuisine: "",
    effort_level: "",
    reminder_time: "09:00",
    // ...other fields for steps 1-3
  });

  // Load user and preferences
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();
        if (!user || !session) {
          setError("Not logged in. Please sign in.");
          setLoading(false);
          return;
        }
        setUser(user);
        // Fetch preferences from Express backend using user's access token
        const res = await fetch(`${API_BASE}/api/preferences/get`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setForm((prev) => ({ ...prev, ...data.preferences }));
          }
        }
      } catch (e) {
        setError("Failed to load preferences.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Step navigation
  const next = () => setStep((s) => Math.min(s + 1, 5));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  // Handle field change
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

  // Final submit (from Review)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!user || !session) {
        setSubmitError("Not logged in.");
        setSubmitLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE}/api/preferences/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
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
    return <div className="p-12 text-center text-gray-500">Loading…</div>;
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
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-black mb-2">Preferences</h1>
      <p className="text-gray-600 mb-6">Personalize your experience in 5 quick steps.</p>
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
        {STEP_LABELS.map((label, i) => (
          <span key={label} className={i + 1 === step ? "text-green-800" : ""}>
            {i + 1 === step ? "●" : "○"} {label}
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* STEP 1: Basic Preferences */}
        {step === 1 && (
          <section className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Target Goal</label>
              <select
                name="target_goal"
                value={form.target_goal}
                onChange={handleChange}
                required
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="" disabled>Select a goal…</option>
                {TARGET_GOALS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Preferred Cuisine</label>
              <select
                name="preferred_cuisine"
                value={form.preferred_cuisine}
                onChange={handleChange}
                required
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="" disabled>Select cuisine…</option>
                {CUISINES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </section>
        )}

        {/* STEP 2: Constraints (placeholder) */}
        {step === 2 && (
          <section className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Effort Level</label>
              <select
                name="effort_level"
                value={form.effort_level}
                onChange={handleChange}
                required
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="" disabled>Select effort…</option>
                {EFFORT_LEVELS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
          </section>
        )}

        {/* STEP 3: Budget (placeholder) */}
        {step === 3 && (
          <section className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Budget (not implemented)</label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2"
                disabled
                placeholder="Budget step placeholder"
              />
            </div>
          </section>
        )}

        {/* STEP 4: Transition Plan */}
        {step === 4 && (
          <section className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Transition Period (weeks)</label>
              <select
                name="transition_period_weeks"
                value={form.transition_period_weeks}
                onChange={handleChange}
                required
                className="w-full rounded-lg border px-3 py-2"
              >
                {WEEKS_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w} weeks</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Current Non-Veg Meals per Week</label>
              <input
                type="number"
                name="baseline_nonveg_meals"
                value={form.baseline_nonveg_meals}
                onChange={handleChange}
                min={1}
                max={21}
                required
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Daily Reminder Time (UTC)</label>
              <input
                type="time"
                name="reminder_time"
                value={form.reminder_time}
                onChange={handleChange}
                required
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </section>
        )}

        {/* STEP 5: Review */}
        {step === 5 && (
          <section className="space-y-6">
            <h2 className="text-lg font-bold mb-2">Review your preferences</h2>
            <ul className="space-y-2 text-sm">
              <li><b>Target Goal:</b> {form.target_goal}</li>
              <li><b>Preferred Cuisine:</b> {form.preferred_cuisine}</li>
              <li><b>Effort Level:</b> {form.effort_level}</li>
              <li><b>Transition Period:</b> {form.transition_period_weeks} weeks</li>
              <li><b>Non-Veg Meals/Week:</b> {form.baseline_nonveg_meals}</li>
              <li><b>Reminder Time:</b> {form.reminder_time}</li>
            </ul>
            {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
          </section>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-4">
          {step > 1 && (
            <button type="button" onClick={prev} className="rounded-lg px-4 py-2 bg-gray-200 font-bold">Back</button>
          )}
          {step < 5 && (
            <button type="button" onClick={next} className="rounded-lg px-4 py-2 bg-green-700 text-white font-bold">Next</button>
          )}
          {step === 5 && (
            <button type="submit" disabled={submitLoading} className="rounded-lg px-4 py-2 bg-green-700 text-white font-bold">
              {submitLoading ? "Saving…" : "Save Preferences"}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
