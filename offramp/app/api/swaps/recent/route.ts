import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const parseLimit = (raw: string | null): number => {
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  const integer = Math.trunc(parsed);
  if (integer < 1) return DEFAULT_LIMIT;
  if (integer > MAX_LIMIT) return MAX_LIMIT;
  return integer;
};

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseLimit(searchParams.get("limit"));

    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("user_swaps")
      .select("id, from_dish, to_dish, from_category, to_category, rating, image_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      swaps: (data ?? []).map((row) => ({
        id: row.id,
        fromDish: row.from_dish,
        toDish: row.to_dish,
        fromCategory: row.from_category,
        toCategory: row.to_category,
        rating: row.rating,
        imageUrl: row.image_url,
        createdAt: row.created_at,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch recent swaps";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
