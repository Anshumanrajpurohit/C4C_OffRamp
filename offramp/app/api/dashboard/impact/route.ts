import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";
import { getSessionUser } from "@/lib/auth/getSessionUser";

const CO2_PER_MEAL_KG = 2.5;
const WATER_PER_MEAL_LITERS = 1500;
const MONEY_PER_MEAL_INR = 50;

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("user_progress")
      .select("total_meals_replaced")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const meals = data?.total_meals_replaced ?? 0;
    return NextResponse.json({
      meals,
      co2_saved_kg: meals * CO2_PER_MEAL_KG,
      water_saved_liters: meals * WATER_PER_MEAL_LITERS,
      money_saved_inr: meals * MONEY_PER_MEAL_INR,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch impact";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
