import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase/client";

const SECRET = process.env.AUTH_SECRET!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No session" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, SECRET) as { userId: string };

    const { data: user, error } = await supabase
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
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 401 }
    );
  }
}
