import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../lib/supabaseAdminClient";
import { getSessionUser } from "../../../lib/auth/getSessionUser";

export async function POST(req: Request) {
  try {
    const { full_name } = await req.json();
    const adminClient = getSupabaseAdminClient();

    const user = await getSessionUser();
    if (!user) {
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
    const adminClient = getSupabaseAdminClient();

    const user = await getSessionUser();
    if (!user) {
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
