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

    const { data, error } = await admin
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch preferences";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
