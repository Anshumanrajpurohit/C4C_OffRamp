import { Router } from "express";
import { supabase } from "../lib/supabaseClient.js";
import {
  calculateWeeklyTransition,
  generateSwapDays,
} from "../services/transitionService.js";

const router = Router();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

async function getUserFromAuthHeader(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  // Call Supabase auth REST endpoint to get user from access token
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: auth },
  });
  if (!r.ok) return null;
  const json = await r.json();
  return json; // contains user object
}

// POST /api/preferences/save
// Body: { target_goal, transition_period_weeks, baseline_nonveg_meals, preferred_cuisine, effort_level, reminder_time }
router.post("/save", async (req, res) => {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user || !user.id) return res.status(401).json({ error: "Unauthorized" });

    const {
      target_goal,
      transition_period_weeks,
      baseline_nonveg_meals,
      preferred_cuisine,
      effort_level,
      reminder_time,
    } = req.body;

    const user_id = user.id;
    const weeks = Number(transition_period_weeks) || 12;
    const baseline = Number(baseline_nonveg_meals) || 1;

    // Upsert user preferences
    const { error: prefErr } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id,
          target_goal,
          transition_period_weeks: weeks,
          baseline_nonveg_meals: baseline,
          preferred_cuisine,
          effort_level,
          reminder_time,
        },
        { onConflict: "user_id" }
      );

    if (prefErr) return res.status(500).json({ error: prefErr.message });

    // Generate weekly plan and upsert rows
    const plan = calculateWeeklyTransition(baseline, weeks);
    const planRows = plan.map((p) => ({
      user_id,
      week_number: p.week_number,
      meals_to_replace: p.meals_to_replace,
      swap_days: generateSwapDays(p.meals_to_replace),
    }));

    const { error: planErr } = await supabase
      .from("weekly_plans")
      .upsert(planRows, { onConflict: "user_id,week_number" });

    if (planErr) return res.status(500).json({ error: planErr.message });

    // Initialize user progress (upsert)
    const { error: progressErr } = await supabase
      .from("user_progress")
      .upsert(
        {
          user_id,
          total_meals_replaced: 0,
          current_week: 1,
          transition_complete: false,
        },
        { onConflict: "user_id" }
      );

    if (progressErr) return res.status(500).json({ error: progressErr.message });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

// GET /api/preferences/get
// Returns preferences for authenticated user
router.get("/get", async (req, res) => {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user || !user.id) return res.status(401).json({ error: "Unauthorized" });

    const user_id = user.id;
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ preferences: data ?? null });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

export default router;
