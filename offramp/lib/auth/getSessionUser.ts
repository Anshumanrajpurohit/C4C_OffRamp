import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";

const SECRET = process.env.AUTH_SECRET!;

export type SessionUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  city?: string | null;
  region?: string | null;
  budget_level?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!SECRET) {
    throw new Error("Authentication is not configured");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, SECRET, {
    algorithms: ["HS256"],
  }) as { userId: string };

  const adminClient = getSupabaseAdminClient();
  const { data: user, error } = await adminClient
    .from("users")
    .select("id, email, full_name, city, region, budget_level")
    .eq("id", decoded.userId)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}
