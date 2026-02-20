
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type ProfileOnboardingForm = {
  baselineMeals: number;
  targetGoal: string;
  transitionWeeks: number;
  preferredCuisine: string;
  effortLevel: string;
  reminderTime: string;
};

type Props = {
  formData: ProfileOnboardingForm;
  setFormData: (data: ProfileOnboardingForm) => void;
  onComplete?: () => void;
};

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

export default function ProfileOnboardingStep({ formData, setFormData, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setFormData({
            baselineMeals: data.baseline_nonveg_meals ?? 7,
            targetGoal: data.target_goal ?? "",
            transitionWeeks: data.transition_period_weeks ?? 12,
            preferredCuisine: data.preferred_cuisine ?? "",
            effortLevel: data.effort_level ?? "",
            reminderTime: data.reminder_time ?? "09:00",
          });
        }
      } catch (err) {
        setError("Failed to load preferences");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "baselineMeals" || name === "transitionWeeks" ? Number(value) : value,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            baseline_nonveg_meals: formData.baselineMeals,
            target_goal: formData.targetGoal,
            transition_period_weeks: formData.transitionWeeks,
            preferred_cuisine: formData.preferredCuisine,
            effort_level: formData.effortLevel,
            reminder_time: formData.reminderTime,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      if (onComplete) onComplete();
    } catch (err: any) {
      setError(err?.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest">Target Goal</label>
        <select
          name="targetGoal"
          value={formData.targetGoal}
          onChange={handleChange}
          required
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
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
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest">Transition Period</label>
        <select
          name="transitionWeeks"
          value={formData.transitionWeeks}
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
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest">Current Non-Veg Meals per Week</label>
        <input
          type="number"
          name="baselineMeals"
          value={formData.baselineMeals}
          onChange={handleChange}
          min={1}
          max={21}
          required
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest">Preferred Cuisine</label>
        <select
          name="preferredCuisine"
          value={formData.preferredCuisine}
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
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest">Effort Level</label>
        <select
          name="effortLevel"
          value={formData.effortLevel}
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
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest">Daily Reminder Time (UTC)</label>
        <input
          type="time"
          name="reminderTime"
          value={formData.reminderTime}
          onChange={handleChange}
          required
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
        />
      </div>
      {error && (
        <p className="text-red-600 text-sm rounded-lg bg-red-50 px-3 py-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-xl font-bold py-3 text-white text-sm uppercase tracking-widest transition-opacity disabled:opacity-50"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {loading ? "Saving…" : "Save & Continue →"}
      </button>
    </form>
  );
}
