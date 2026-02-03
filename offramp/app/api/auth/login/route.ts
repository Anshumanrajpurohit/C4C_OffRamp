import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";
import { getSupabaseAdminClient } from "../../../../lib/supabaseAdminClient";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toHttpStatus(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 200 && value <= 599) {
    return value;
  }

  return fallback;
}

type LoginPayload = {
  email: string;
  password: string;
};

function parsePayload(body: unknown): LoginPayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }

  return {
    email: email.trim().toLowerCase(),
    password: password.trim(),
  };
}

export async function POST(req: Request) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const payload = parsePayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(payload.email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (payload.password.length === 0) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const adminClient = getSupabaseAdminClient();

    const { data: userRecord, error: fetchError } = await adminClient
      .from("users")
      .select("id, email, full_name, password_hash")
      .eq("email", payload.email)
      .maybeSingle<{ id: string; email: string; full_name: string; password_hash: string }>();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Login lookup error", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!userRecord?.password_hash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(payload.password, userRecord.password_hash);

    if (!passwordMatches) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      const status = toHttpStatus(error.status, 401);
      console.error("Login error", error);
      return NextResponse.json({ error: error.message || "Invalid credentials" }, { status });
    }

    return NextResponse.json({
      message: "Logged in",
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            full_name: userRecord.full_name ?? data.user.user_metadata?.full_name ?? null,
          }
        : null,
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Login handler failure", error);
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
