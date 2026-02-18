import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";
import { getSupabaseAdminClient } from "../../../../lib/supabaseAdminClient";

export const runtime = "nodejs";

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toHttpStatus(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 200 && value <= 599) {
    return value;
  }

  return fallback;
}

type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  region?: string;
  city?: string;
};

function parsePayload(body: unknown): RegisterPayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { email, password, fullName, name, phone, city, region } = body as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }

  return {
    email: email.trim().toLowerCase(),
    password: password.trim(),
    fullName:
      typeof fullName === "string"
        ? fullName.trim()
        : typeof name === "string"
          ? name.trim()
          : "",
    phone: typeof phone === "string" ? phone.trim() : "",
    region: typeof region === "string" ? region.trim() : undefined,
    city: typeof city === "string" ? city.trim() : undefined,
  };
}

function validatePayload(payload: RegisterPayload) {
  const errors: string[] = [];

  if (!EMAIL_REGEX.test(payload.email)) {
    errors.push("Invalid email address");
  }

  if (payload.password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (!payload.fullName || payload.fullName.length < 2) {
    errors.push("Full name must be at least 2 characters");
  }

  if (!payload.phone) {
    errors.push("Phone number is required");
  } else if (payload.phone.length < 7) {
    errors.push("Phone number looks incorrect");
  } else {
    const normalizedPhone = payload.phone.replace(/[^\d]/g, "");
    if (normalizedPhone.length < 7) {
      errors.push("Phone number looks incorrect");
    }
  }

  if (payload.city && payload.city.length < 2) {
    errors.push("City must be at least 2 characters");
  }

  if (payload.region && payload.region.length < 2) {
    errors.push("Region must be at least 2 characters");
  }

  return errors;
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
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validationErrors = validatePayload(payload);

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join(", ") }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const adminClient = getSupabaseAdminClient();
    const cleanPhone = payload.phone.replace(/[^+\d\-()\s]/g, "");
    const normalizedCity = payload.city && payload.city.length > 0 ? payload.city : "Bangalore";
    const normalizedRegion = payload.region && payload.region.length > 0 ? payload.region : null;

    const {
      data: existingUser,
      error: existingError,
    } = await adminClient
      .from("users")
      .select("id")
      .eq("email", payload.email)
      .maybeSingle<{ id: string }>();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("User lookup error", existingError);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
          phone: cleanPhone,
          region: normalizedRegion,
          city: normalizedCity,
        },
      },
    });

    if (error) {
      const status = toHttpStatus(error.status, error.code === "user_already_exists" ? 409 : 400);
      console.error("Register error", error);
      return NextResponse.json({ error: error.message }, { status });
    }

    let activeSession = data.session ?? null;
    const registeredUser = data.user ?? null;

    if (registeredUser && !activeSession) {
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(registeredUser.id, {
        email_confirm: true,
      });

      if (confirmError) {
        console.error("Email confirm fallback error", confirmError);
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: payload.email,
          password: payload.password,
        });

        if (signInError) {
          console.error("Post-register sign-in fallback error", signInError);
        } else {
          activeSession = signInData.session ?? null;
        }
      }
    }

    const supabaseUserId = registeredUser?.id ?? crypto.randomUUID();

    const { error: insertError } = await adminClient.from("users").insert({
      id: supabaseUserId,
      full_name: payload.fullName,
      email: payload.email,
      password_hash: passwordHash,
      phone: cleanPhone,
      region: normalizedRegion,
      city: normalizedCity,
      budget_level: null,
    });

    if (insertError) {
      console.error("User insert error", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: activeSession ? "Account created" : "Account created. Please sign in to continue.",
      sessionReady: Boolean(activeSession),
      user: registeredUser
        ? {
            id: registeredUser.id,
            email: registeredUser.email,
            full_name: payload.fullName,
          }
        : null,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("Register handler failure", error);
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
