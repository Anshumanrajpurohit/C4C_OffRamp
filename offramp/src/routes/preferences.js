import { Router } from "express";
import { supabase } from "../lib/supabaseClient.js";
import {
  calculateWeeklyTransition,
  generateSwapDays,
} from "../services/transitionService.js";

const router = Router();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_AUTH_API_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_PREFERENCE_CATEGORY = "target_goal";

function toOptionalText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toOptionalPositiveInt(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const integer = Math.trunc(parsed);
  return integer > 0 ? integer : null;
}

async function getUserFromAuthHeader(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith("Bearer ") || !SUPABASE_URL) return null;
  // Call Supabase auth REST endpoint to get user from access token
  const headers = { Authorization: auth };
  if (SUPABASE_AUTH_API_KEY) {
    headers.apikey = SUPABASE_AUTH_API_KEY;
  }

  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers,
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
      preference_name,
      preference_category,
    } = req.body;

    const user_id = user.id;
    const preferenceName = toOptionalText(preference_name) ?? toOptionalText(target_goal);
    const preferenceCategory =
      toOptionalText(preference_category) ?? DEFAULT_PREFERENCE_CATEGORY;
    const weeks = toOptionalPositiveInt(transition_period_weeks);
    const baseline = toOptionalPositiveInt(baseline_nonveg_meals);

    if (!preferenceName) {
      return res.status(400).json({ error: "Missing preference_name (or target_goal)." });
    }

    // Resolve preference_id from dietary_preferences.
    const { data: dietaryPref, error: dietaryErr } = await supabase
      .from("dietary_preferences")
      .upsert(
        {
          name: preferenceName,
          category: preferenceCategory,
        },
        { onConflict: "name" }
      )
      .select("id")
      .single();

    if (dietaryErr || !dietaryPref?.id) {
      return res.status(500).json({ error: dietaryErr?.message || "Failed to resolve preference_id." });
    }

    // Keep one active row for this user in current app flow.
    const { error: cleanupErr } = await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", user_id)
      .neq("preference_id", dietaryPref.id);

    if (cleanupErr) return res.status(500).json({ error: cleanupErr.message });

    // Upsert user preferences using non-null preference_id.
    const { error: prefErr } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id,
          preference_id: dietaryPref.id,
          target_goal: toOptionalText(target_goal),
          transition_period_weeks: weeks,
          baseline_nonveg_meals: baseline,
          preferred_cuisine: toOptionalText(preferred_cuisine),
          effort_level: toOptionalText(effort_level),
          reminder_time: toOptionalText(reminder_time),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,preference_id" }
      );

    if (prefErr) return res.status(500).json({ error: prefErr.message });

    // Generate weekly plan and upsert rows
    const plan = calculateWeeklyTransition(baseline ?? 1, weeks ?? 12);
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
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ preferences: data ?? null });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

export default router;
