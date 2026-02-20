import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";

const SECRET = process.env.AUTH_SECRET!;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!SECRET) {
      return NextResponse.json(
        { error: "Authentication is not configured" },
        { status: 500 }
      );
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const adminClient = getSupabaseAdminClient();

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Fetch user from database
    const { data: user, error } = await adminClient
      .from("users")
      .select("id, email, full_name, password_hash, city, region, budget_level")
      .eq("email", normalizedEmail)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Compare bcrypt password
    const passwordMatch = await bcrypt.compare(
      normalizedPassword,
      user.password_hash
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session token
    const token = jwt.sign(
      { userId: user.id },
      SECRET,
      { expiresIn: "7d" }
    );

    // Store session cookie
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7
    });

    // SUCCESS → redirect to profile
    return NextResponse.json({
      success: true,
      redirect: "/profile",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        city: user.city,
        region: user.region,
        budget_level: user.budget_level
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
