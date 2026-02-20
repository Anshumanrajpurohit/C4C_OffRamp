import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";

const SECRET = process.env.AUTH_SECRET!;

export async function GET() {
  try {
    if (!SECRET) {
      return NextResponse.json(
        { error: "Authentication is not configured" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No session" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as { userId: string };
    const adminClient = getSupabaseAdminClient();

    const { data: user, error } = await adminClient
      .from("users")
      .select("id, email, full_name, city, region, budget_level")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 401 }
    );
  }
}
