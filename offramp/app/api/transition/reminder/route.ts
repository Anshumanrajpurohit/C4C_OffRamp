/**
 * GET /api/transition/reminder
 *
 * MVP Cron-callable endpoint.
 * Call this route on a schedule (e.g. Vercel Cron, external cron) every minute.
 * It checks which users have their reminder_time near the current time,
 * then inserts a daily_swap record if today is one of their swap days.
 *
 * Secure this with CRON_SECRET in production.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";
import { getTodayDayName } from "@/services/transitionService";

export async function GET(req: NextRequest) {
  // Lightweight security: shared secret header
  const secret = req.headers.get("x-cron-secret");
  if (
    process.env.CRON_SECRET &&
    secret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();
  const today = getTodayDayName();

  // Current HH:MM in UTC (simple MVP match)
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const currentTime = `${hh}:${mm}`;

  // Fetch all preferences that have a reminder_time matching now (±1 min tolerance)
  const { data: prefs, error: prefError } = await admin
    .from("user_preferences")
    .select("user_id, reminder_time, baseline_nonveg_meals, transition_period_weeks");

  if (prefError) {
    return NextResponse.json({ error: prefError.message }, { status: 500 });
  }

  const triggered: string[] = [];

  for (const pref of prefs ?? []) {
    if (!pref.reminder_time) continue;

    // Simple string equality on HH:MM
    const reminderHHMM = pref.reminder_time.slice(0, 5);
    if (reminderHHMM !== currentTime) continue;

    // Determine current week from user_progress
    const { data: progress } = await admin
      .from("user_progress")
      .select("current_week")
      .eq("user_id", pref.user_id)
      .maybeSingle();

    const currentWeek = progress?.current_week ?? 1;

    // Get this week's plan
    const { data: weekPlan } = await admin
      .from("weekly_plans")
      .select("swap_days")
      .eq("user_id", pref.user_id)
      .eq("week_number", currentWeek)
      .maybeSingle();

    const swapDays: string[] = weekPlan?.swap_days ?? [];

    if (!swapDays.includes(today)) continue;

    // Insert daily swap record (ignore duplicates via upsert)
    const todayDate = now.toISOString().slice(0, 10);
    const { error: swapError } = await admin.from("daily_swaps").upsert(
      {
        user_id: pref.user_id,
        swap_date: todayDate,
        week_number: currentWeek,
        completed: false,
      },
      { onConflict: "user_id,swap_date" }
    );

    if (!swapError) {
      triggered.push(pref.user_id);
    }
  }

  return NextResponse.json({
    checked_at: currentTime,
    day: today,
    triggered_count: triggered.length,
    triggered_users: triggered,
  });
}
