import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseServer";
import { getSupabaseAdminClient } from "../../../lib/supabaseAdminClient";

export async function POST(req: Request) {
  try {
    const { full_name } = await req.json();
    const supabase = await createSupabaseServerClient();
    const adminClient = getSupabaseAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedName = typeof full_name === "string" ? full_name.trim() : null;

    const { error: updateError } = await adminClient
      .from("users")
      .update({
        full_name: normalizedName,
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update profile" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const adminClient = getSupabaseAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: fetchError } = await adminClient
      .from("users")
      .select("id, full_name, email, phone, region, city, budget_level")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: profile
        ? {
            ...profile,
            avatar_url: null,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch profile" }, { status: 500 });
  }
}
