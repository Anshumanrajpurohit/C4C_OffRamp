import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import {
  DEFAULT_FROM_DATASET,
  DEFAULT_FROM_DIET,
  DEFAULT_TO_DATASET,
  DEFAULT_TO_DIET,
  normalizeDiet,
  resolveDatasetFromDiet,
} from "@/lib/dietTransition";

export const runtime = "nodejs";

type SearchBody = {
  dish_name?: string;
  dish_query?: string;
  query?: string;
  top_n?: number;
  from?: string;
  to?: string;
  from_dataset?: string;
  to_dataset?: string;
  protein_level?: "low" | "medium" | "high" | "very_high";
  price_level?: "low" | "medium" | "high";
  sort_by?: "score" | "protein" | "price";
};

type BridgeSuccess = {
  from_dataset?: string;
  to_dataset?: string;
  query?: string;
  results?: unknown[];
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
};

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
};

const normalizeSearchRows = (value: unknown): unknown[] => {
  const rows = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { results?: unknown[] }).results)
      ? (value as { results?: unknown[] }).results ?? []
      : [];

  return rows
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"))
    .map((row) => {
      const score = toFiniteNumber(row.score) ?? 0;
      const similarity = toFiniteNumber(row.similarity) ?? toFiniteNumber(row.similarity_score) ?? score;

      return {
        dish_id: toStringValue(row.dish_id),
        name: toStringValue(row.name) ?? toStringValue(row.dish_name),
        dish_name: toStringValue(row.dish_name) ?? toStringValue(row.name),
        protein: toStringValue(row.protein),
        price_range: toStringValue(row.price_range) ?? toStringValue(row.price),
        price: toStringValue(row.price) ?? toStringValue(row.price_range),
        availability: toStringValue(row.availability),
        score,
        similarity,
        similarity_score: similarity,
        matched_ingredients: toStringList(row.matched_ingredients),
        reasons: toStringList(row.reasons),
        from_dataset: toStringValue(row.from_dataset),
        to_dataset: toStringValue(row.to_dataset),
      };
    });
};

const runSearchBridge = async (payload: Record<string, unknown>): Promise<BridgeSuccess> => {
  const pythonBin = process.env.PYTHON_BIN?.trim() || "python";
  const bridgePath = path.join(process.cwd(), "services", "search_bridge.py");

  return await new Promise<BridgeSuccess>((resolve, reject) => {
    const child = spawn(pythonBin, [bridgePath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);

    child.on("close", (code) => {
      let parsed: unknown = {};
      try {
        parsed = stdout.trim() ? JSON.parse(stdout) : {};
      } catch (error) {
        reject(new Error(`search_bridge.py returned non-JSON output: ${String(error)}`));
        return;
      }

      if (code !== 0) {
        const bridgeError =
          typeof parsed === "object" && parsed && "error" in parsed ? (parsed as { error?: string }).error : null;
        reject(new Error(bridgeError || stderr.trim() || "search_bridge.py failed"));
        return;
      }

      if (!parsed || typeof parsed !== "object") {
        reject(new Error("search_bridge.py returned invalid payload"));
        return;
      }

      resolve(parsed as BridgeSuccess);
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
};

const runSearchDirect = async (payload: Record<string, unknown>): Promise<BridgeSuccess> => {
  const baseUrl =
    process.env.PLANT_SEARCH_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_PLANT_SEARCH_API_BASE_URL?.trim() ||
    "http://127.0.0.1:8000";
  const endpoint = `${baseUrl.replace(/\/$/, "")}/search`;
  const dishQuery = toStringValue(payload.dish_query) ?? toStringValue(payload.dish_name) ?? "";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      ...payload,
      dish_name: dishQuery,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Direct search request failed (${response.status})${errorText ? `: ${errorText}` : ""}`
    );
  }

  const text = await response.text();
  let parsed: unknown = [];
  try {
    parsed = text ? JSON.parse(text) : [];
  } catch {
    parsed = [];
  }

  return {
    from_dataset: toStringValue(payload.from_dataset),
    to_dataset: toStringValue(payload.to_dataset),
    query: dishQuery,
    results: normalizeSearchRows(parsed),
  };
};

const readProfileTransition = async (userId: string) => {
  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("users")
      .select("transition_from_diet, transition_to_diet")
      .eq("id", userId)
      .maybeSingle();

    return {
      fromDiet: normalizeDiet(data?.transition_from_diet),
      toDiet: normalizeDiet(data?.transition_to_diet),
    };
  } catch {
    return {
      fromDiet: null,
      toDiet: null,
    };
  }
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SearchBody;
    const dishQuery = (body.dish_query || body.dish_name || body.query || "").trim();
    if (!dishQuery) {
      return NextResponse.json({ error: "dish_query is required" }, { status: 400 });
    }

    let sessionUser = null;
    try {
      sessionUser = await getSessionUser();
    } catch {
      sessionUser = null;
    }

    const requestedFromDiet = normalizeDiet(body.from);
    const requestedToDiet = normalizeDiet(body.to);
    const profileTransition = sessionUser?.id ? await readProfileTransition(sessionUser.id) : null;

    const effectiveFromDiet = requestedFromDiet || profileTransition?.fromDiet || DEFAULT_FROM_DIET;
    const effectiveToDiet = requestedToDiet || profileTransition?.toDiet || DEFAULT_TO_DIET;

    const fromDataset = body.from_dataset?.trim() || resolveDatasetFromDiet(effectiveFromDiet, DEFAULT_FROM_DATASET);
    const toDataset = body.to_dataset?.trim() || resolveDatasetFromDiet(effectiveToDiet, DEFAULT_TO_DATASET);

    const bridgePayload = {
      dish_query: dishQuery,
      top_n: typeof body.top_n === "number" ? body.top_n : 9,
      from: effectiveFromDiet,
      to: effectiveToDiet,
      from_dataset: fromDataset,
      to_dataset: toDataset,
      protein_level: body.protein_level,
      price_level: body.price_level,
      sort_by: body.sort_by,
    };

    let bridgeResponse: BridgeSuccess = { results: [] };
    let warning: string | null = null;

    try {
      bridgeResponse = await runSearchBridge(bridgePayload);
    } catch (bridgeError) {
      const bridgeMessage = bridgeError instanceof Error ? bridgeError.message : "search bridge failed";
      try {
        bridgeResponse = await runSearchDirect(bridgePayload);
        warning = `Bridge unavailable; served by direct backend call. ${bridgeMessage}`;
      } catch (directError) {
        const directMessage = directError instanceof Error ? directError.message : "direct backend call failed";
        warning = `Search backend unavailable. ${bridgeMessage}; ${directMessage}`;
        bridgeResponse = {
          from_dataset: fromDataset,
          to_dataset: toDataset,
          query: dishQuery,
          results: [],
        };
      }
    }
    const results = normalizeSearchRows(bridgeResponse.results);

    return NextResponse.json({
      query: dishQuery,
      from_diet: effectiveFromDiet,
      to_diet: effectiveToDiet,
      from_dataset: fromDataset,
      to_dataset: toDataset,
      results,
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
