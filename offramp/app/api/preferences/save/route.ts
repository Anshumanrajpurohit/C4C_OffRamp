import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";
import {
  calculateWeeklyTransition,
  generateSwapDays,
} from "@/services/transitionService";

const DEFAULT_PREFERENCE_CATEGORY = "target_goal";

function toOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toOptionalPositiveInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const integer = Math.trunc(parsed);
  return integer > 0 ? integer : null;
}

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
      preference_name,
      preference_category,
    } = body;

    const preferenceName = toOptionalText(preference_name) ?? toOptionalText(target_goal);
    const preferenceCategory =
      toOptionalText(preference_category) ?? DEFAULT_PREFERENCE_CATEGORY;
    const transitionWeeks = toOptionalPositiveInt(transition_period_weeks);
    const baselineMeals = toOptionalPositiveInt(baseline_nonveg_meals);

    if (!preferenceName) {
      return NextResponse.json(
        { error: "Missing preference_name (or target_goal)." },
        { status: 400 }
      );
    }

    // 1) Ensure dietary preference exists and always get a valid id.
    const { data: dietaryPreference, error: dietaryError } = await admin
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

    if (dietaryError || !dietaryPreference?.id) {
      return NextResponse.json(
        { error: dietaryError?.message ?? "Failed to resolve preference_id." },
        { status: 500 }
      );
    }

    // Keep one active preference record per user for this flow.
    const { error: cleanupError } = await admin
      .from("user_preferences")
      .delete()
      .eq("user_id", user.id)
      .neq("preference_id", dietaryPreference.id);

    if (cleanupError) {
      return NextResponse.json({ error: cleanupError.message }, { status: 500 });
    }

    // 2) Upsert user preferences using guaranteed non-null preference_id.
    const { error: prefError } = await admin.from("user_preferences").upsert(
      {
        user_id: user.id,
        preference_id: dietaryPreference.id,
        baseline_nonveg_meals: baselineMeals,
        target_goal: toOptionalText(target_goal),
        transition_period_weeks: transitionWeeks,
        preferred_cuisine: toOptionalText(preferred_cuisine),
        effort_level: toOptionalText(effort_level),
        reminder_time: toOptionalText(reminder_time),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,preference_id" }
    );

    if (prefError) {
      return NextResponse.json({ error: prefError.message }, { status: 500 });
    }

    // 3) Generate and insert weekly plan.
    const plan = calculateWeeklyTransition(baselineMeals ?? 1, transitionWeeks ?? 12);

    // Remove old plan rows for this user before re-inserting.
    await admin.from("weekly_plans").delete().eq("user_id", user.id);

    const planRows = plan.map((p) => ({
      user_id: user.id,
      week_number: p.week_number,
      meals_to_replace: p.meals_to_replace,
      swap_days: generateSwapDays(p.meals_to_replace),
    }));

    const { error: planError } = await admin.from("weekly_plans").insert(planRows);

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 500 });
    }

    // 4) Initialize progress record (upsert so it does not duplicate).
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
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to save preferences";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
