import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ message: "Logged out" });
}
