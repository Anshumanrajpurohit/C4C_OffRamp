import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (error.message?.toLowerCase().includes("session")) {
        return NextResponse.json({ user: null }, { status: 200 });
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const adminClient = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from("users")
      .select("id, full_name, email, phone, region, city, budget_level")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Session profile lookup error", profileError);
      return NextResponse.json({ error: "Unable to load profile" }, { status: 500 });
    }

    const responseUser = {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? user.user_metadata?.full_name ?? "",
      phone: profile?.phone ?? null,
      region: profile?.region ?? null,
      city: profile?.city ?? null,
      budget_level: profile?.budget_level ?? null,
    };

    return NextResponse.json({ user: responseUser }, { status: 200 });
  } catch (error) {
    console.error("Session handler failure", error);
    return NextResponse.json({ error: "Unable to determine session" }, { status: 500 });
  }
}
