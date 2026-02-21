import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid session";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
