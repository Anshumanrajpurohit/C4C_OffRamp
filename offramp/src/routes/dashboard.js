import { Router } from "express";
import { supabase } from "../lib/supabaseClient.js";

const router = Router();

// ────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/progress/:user_id
// Returns:
//   total_meals_replaced, current_week, total_weeks,
//   baseline_nonveg_meals, transition_complete, completion_percentage
// ────────────────────────────────────────────────────────────────────────────
router.get("/progress/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    // Fetch preferences + progress in parallel
    const [prefResult, progressResult] = await Promise.all([
      supabase
        .from("user_preferences")
        .select("baseline_nonveg_meals, transition_period_weeks")
        .eq("user_id", user_id)
        .maybeSingle(),
      supabase
        .from("user_progress")
        .select("total_meals_replaced, current_week")
        .eq("user_id", user_id)
        .maybeSingle(),
    ]);

    if (prefResult.error)
      return res.status(500).json({ error: prefResult.error.message });

    if (!prefResult.data)
      return res
        .status(404)
        .json({ error: "No preferences found. Complete onboarding first." });

    const baseline = prefResult.data.baseline_nonveg_meals ?? 1;
    const totalWeeks = prefResult.data.transition_period_weeks ?? 1;
    const totalMealsReplaced =
      progressResult.data?.total_meals_replaced ?? 0;
    const currentWeek = progressResult.data?.current_week ?? 1;

    // completion = (total meals replaced across all weeks) / (baseline × totalWeeks)
    const completionPercentage = Math.min(
      Math.round((totalMealsReplaced / (baseline * totalWeeks)) * 100),
      100
    );

    return res.json({
      total_meals_replaced: totalMealsReplaced,
      current_week: currentWeek,
      total_weeks: totalWeeks,
      baseline_nonveg_meals: baseline,
      transition_complete: completionPercentage >= 100,
      completion_percentage: completionPercentage,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/weekly-plans/:user_id
// Returns ordered weekly plan rows: week_number, meals_to_replace, swap_days
// ────────────────────────────────────────────────────────────────────────────
router.get("/weekly-plans/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from("weekly_plans")
      .select("week_number, meals_to_replace, swap_days")
      .eq("user_id", user_id)
      .order("week_number", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ plan: data ?? [] });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

export default router;
