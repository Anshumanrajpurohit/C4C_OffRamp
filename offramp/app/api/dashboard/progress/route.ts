import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch preferences + progress in parallel
    const [prefResult, progressResult] = await Promise.all([
      admin
        .from("user_preferences")
        .select("baseline_nonveg_meals, transition_period_weeks")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("user_progress")
        .select("total_meals_replaced, current_week")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (prefResult.error) {
      return NextResponse.json(
        { error: prefResult.error.message },
        { status: 500 }
      );
    }

    if (!prefResult.data) {
      return NextResponse.json(
        { error: "No preferences found. Complete onboarding first." },
        { status: 404 }
      );
    }

    const baseline = prefResult.data.baseline_nonveg_meals ?? 1;
    const totalWeeks = prefResult.data.transition_period_weeks ?? 1;
    const totalMealsReplaced =
      progressResult.data?.total_meals_replaced ?? 0;
    const currentWeek = progressResult.data?.current_week ?? 1;

    const completionPercentage = Math.min(
      Math.round((totalMealsReplaced / (baseline * totalWeeks)) * 100),
      100
    );

    return NextResponse.json({
      total_meals_replaced: totalMealsReplaced,
      current_week: currentWeek,
      total_weeks: totalWeeks,
      baseline_nonveg_meals: baseline,
      transition_complete: completionPercentage >= 100,
      completion_percentage: completionPercentage,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch dashboard data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
