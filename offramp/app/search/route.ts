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

const readProfileTransition = async (userId: string) => {
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

    const bridgeResponse = await runSearchBridge(bridgePayload);
    const results = Array.isArray(bridgeResponse.results) ? bridgeResponse.results : [];

    return NextResponse.json({
      query: dishQuery,
      from_diet: effectiveFromDiet,
      to_diet: effectiveToDiet,
      from_dataset: fromDataset,
      to_dataset: toDataset,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

