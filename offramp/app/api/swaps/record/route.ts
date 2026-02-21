import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";

type RecordSwapRequest = {
  fromDish?: unknown;
  toDish?: unknown;
  fromCategory?: unknown;
  toCategory?: unknown;
  rating?: unknown;
  imageUrl?: unknown;
};

const DEDUPE_WINDOW_MS = 10_000;

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeRating = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
};

async function getCurrentMealsReplaced(userId: string): Promise<number> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("user_progress")
    .select("total_meals_replaced")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.total_meals_replaced ?? 0;
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RecordSwapRequest;
    const fromDish = normalizeText(body.fromDish);
    const toDish = normalizeText(body.toDish);
    const fromCategory = normalizeText(body.fromCategory);
    const toCategory = normalizeText(body.toCategory);
    const imageUrl = normalizeText(body.imageUrl);
    const rating = normalizeRating(body.rating);

    if (!fromDish || !toDish) {
      return NextResponse.json({ error: "fromDish and toDish are required" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const dedupeSinceIso = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();

    const { data: duplicateRow } = await admin
      .from("user_swaps")
      .select("id")
      .eq("user_id", user.id)
      .eq("from_dish", fromDish)
      .eq("to_dish", toDish)
      .gte("created_at", dedupeSinceIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (duplicateRow) {
      const totalMealsReplaced = await getCurrentMealsReplaced(user.id);
      return NextResponse.json({ ok: true, total_meals_replaced: totalMealsReplaced });
    }

    const { error: insertError } = await admin.from("user_swaps").insert({
      user_id: user.id,
      from_dish: fromDish,
      to_dish: toDish,
      from_category: fromCategory,
      to_category: toCategory,
      rating,
      image_url: imageUrl,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { data: currentProgress, error: progressReadError } = await admin
      .from("user_progress")
      .select("total_meals_replaced")
      .eq("user_id", user.id)
      .maybeSingle();

    if (progressReadError) {
      return NextResponse.json({ error: progressReadError.message }, { status: 500 });
    }

    const nextTotal = (currentProgress?.total_meals_replaced ?? 0) + 1;

    if (currentProgress) {
      const { error: updateError } = await admin
        .from("user_progress")
        .update({ total_meals_replaced: nextTotal })
        .eq("user_id", user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      const { error: insertProgressError } = await admin.from("user_progress").insert({
        user_id: user.id,
        total_meals_replaced: nextTotal,
        current_week: 1,
      });

      if (insertProgressError) {
        return NextResponse.json({ error: insertProgressError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, total_meals_replaced: nextTotal });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record swap";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
