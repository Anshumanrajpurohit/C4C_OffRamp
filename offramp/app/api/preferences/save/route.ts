import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";
import {
  calculateWeeklyTransition,
  generateSwapDays,
} from "@/services/transitionService";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = getSupabaseAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      target_goal,
      transition_period_weeks,
      baseline_nonveg_meals,
      preferred_cuisine,
      effort_level,
      reminder_time,
    } = body;

    // ── 1. Upsert user preferences ────────────────────────────────────────────
    const { error: prefError } = await admin
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          target_goal,
          transition_period_weeks: Number(transition_period_weeks),
          baseline_nonveg_meals: Number(baseline_nonveg_meals),
          preferred_cuisine,
          effort_level,
          reminder_time,
        },
        { onConflict: "user_id" }
      );

    if (prefError) {
      return NextResponse.json({ error: prefError.message }, { status: 500 });
    }

    // ── 2. Generate and insert weekly plan ────────────────────────────────────
    const plan = calculateWeeklyTransition(
      Number(baseline_nonveg_meals),
      Number(transition_period_weeks)
    );

    // Remove old plan rows for this user before re-inserting
    await admin.from("weekly_plans").delete().eq("user_id", user.id);

    const planRows = plan.map((p) => ({
      user_id: user.id,
      week_number: p.week_number,
      meals_to_replace: p.meals_to_replace,
      swap_days: generateSwapDays(p.meals_to_replace),
    }));

    const { error: planError } = await admin
      .from("weekly_plans")
      .insert(planRows);

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 500 });
    }

    // ── 3. Initialize progress record (upsert so it won't duplicate) ──────────
    const { error: progressError } = await admin
      .from("user_progress")
      .upsert(
        {
          user_id: user.id,
          total_meals_replaced: 0,
          current_week: 1,
        },
        { onConflict: "user_id" }
      );

    if (progressError) {
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, plan });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to save preferences";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
