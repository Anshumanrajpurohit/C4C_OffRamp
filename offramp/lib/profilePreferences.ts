import type { SupabaseClient } from "@supabase/supabase-js";

export type BudgetLevel = 1 | 2 | 3;

export type UserPreferences = {
  region: string | null;
  budgetLevel: BudgetLevel | null;
  cuisines: string[];
  allergies: string[];
  transitionFromDiet: string | null;
  transitionToDiet: string | null;
};

type LookupTable = "cuisines" | "allergies";
type JunctionTable = "user_cuisines" | "user_allergies";
type JunctionIdColumn = "cuisine_id" | "allergy_id";
type IdValue = string | number;

type LookupRow = {
  id: IdValue;
  name: string;
};

type JunctionRow = Record<string, IdValue | null>;
type BudgetLevelDbValue = "low" | "medium" | "high";
type UserRow = {
  region: string | null;
  budget_level: BudgetLevelDbValue | number | null;
  transition_from_diet: string | null;
  transition_to_diet: string | null;
};

const isBudgetLevelValue = (value: unknown): value is BudgetLevel => value === 1 || value === 2 || value === 3;
const FALLBACK_BUDGET_LEVEL: BudgetLevel = 1;
const BUDGET_LEVEL_TO_DB: Record<BudgetLevel, BudgetLevelDbValue> = {
  1: "low",
  2: "medium",
  3: "high",
};

const DB_TO_BUDGET_LEVEL: Record<BudgetLevelDbValue, BudgetLevel> = {
  low: 1,
  medium: 2,
  high: 3,
};

const normalizeBudgetLevel = (value: unknown): BudgetLevel => {
  if (isBudgetLevelValue(value)) {
    return value;
  }

  const numeric = typeof value === "string" ? Number(value) : typeof value === "number" ? value : Number.NaN;
  if (isBudgetLevelValue(numeric)) {
    return numeric as BudgetLevel;
  }

  if (!Number.isFinite(numeric)) {
    return FALLBACK_BUDGET_LEVEL;
  }

  if (numeric <= 1) {
    return 1;
  }
  if (numeric >= 3) {
    return 3;
  }
  return 2;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  region: null,
  budgetLevel: null,
  cuisines: [],
  allergies: [],
  transitionFromDiet: null,
  transitionToDiet: null,
};

type SupabaseErrorLike = Error & {
  code?: string;
  details?: string;
  cause?: unknown;
};

const throwOnSupabaseError = (context: string, error: SupabaseErrorLike | null) => {
  if (!error) {
    return;
  }

  const enriched = Object.assign(new Error(`[${context}] ${error.message ?? "Supabase request failed"}`), {
    code: error.code,
    details: error.details,
    cause: error,
  });

  throw enriched;
};

async function fetchIdsByNames(
  client: SupabaseClient,
  table: LookupTable,
  names: string[]
): Promise<LookupRow[]> {
  const uniqueNames = Array.from(new Set(names));
  if (!uniqueNames.length) {
    return [];
  }

  const { data, error } = await client.from(table).select("id, name").in("name", uniqueNames);
  throwOnSupabaseError("fetchIdsByNames", error);

  return ((data ?? []) as LookupRow[]);
}

async function ensureLookupRows(
  client: SupabaseClient,
  table: LookupTable,
  names: string[]
): Promise<LookupRow[]> {
  const uniqueNames = Array.from(new Set(names));
  if (!uniqueNames.length) {
    return [];
  }

  const existingRows = await fetchIdsByNames(client, table, uniqueNames);
  const existingNames = new Set(existingRows.map((row) => row.name));
  const missingNames = uniqueNames.filter((name) => !existingNames.has(name));

  if (!missingNames.length) {
    return existingRows;
  }

  const insertPayload = missingNames.map((name) => ({ name }));
  const { data, error } = await client
    .from(table)
    .upsert(insertPayload, { onConflict: "name" })
    .select("id, name");
  throwOnSupabaseError(`ensureLookupRows:upsert:${table}`, error);

  const insertedRows = ((data ?? []) as LookupRow[]);
  const rowsByName = new Map<string, LookupRow>();
  [...existingRows, ...insertedRows].forEach((row) => rowsByName.set(row.name, row));

  return Array.from(rowsByName.values());
}

async function fetchRelatedNames(
  client: SupabaseClient,
  options: {
    junctionTable: JunctionTable;
    idColumn: JunctionIdColumn;
    lookupTable: LookupTable;
    userId: string;
  }
): Promise<string[]> {
  const { junctionTable, idColumn, lookupTable, userId } = options;
  const { data: junctionData, error: junctionError } = await client
    .from(junctionTable)
    .select(idColumn)
    .eq("user_id", userId);
  throwOnSupabaseError("fetchRelatedNames:junction", junctionError);

  const ids = ((junctionData as JunctionRow[]) ?? [])
    .map((row) => row[idColumn] as IdValue | null)
    .filter((value): value is IdValue => value !== null && value !== undefined);

  if (!ids.length) {
    return [];
  }

  const { data: lookupRows, error: lookupError } = await client
    .from(lookupTable)
    .select("id, name")
    .in("id", ids);
  throwOnSupabaseError("fetchRelatedNames:lookup", lookupError);

  const lookupRecords = ((lookupRows ?? []) as LookupRow[]);
  const labelById = new Map<IdValue, string>(lookupRecords.map(({ id, name }) => [id, name]));

  return Array.from(
    new Set(
      ids
        .map((id) => labelById.get(id))
        .filter((name): name is string => typeof name === "string")
    )
  );
}

export async function fetchUserPreferences(
  client: SupabaseClient,
  userId: string
): Promise<UserPreferences> {
  const { data: userRow, error: userError } = await client
    .from("users")
    .select("region, budget_level, transition_from_diet, transition_to_diet")
    .eq("id", userId)
    .maybeSingle<UserRow>();
  throwOnSupabaseError("fetchUserPreferences:user", userError);

  const cuisines = await fetchRelatedNames(client, {
    junctionTable: "user_cuisines",
    idColumn: "cuisine_id",
    lookupTable: "cuisines",
    userId,
  });

  const allergies = await fetchRelatedNames(client, {
    junctionTable: "user_allergies",
    idColumn: "allergy_id",
    lookupTable: "allergies",
    userId,
  });

  if (!userRow) {
    return { ...DEFAULT_PREFERENCES, cuisines, allergies };
  }

  return {
    region: userRow.region ?? null,
    budgetLevel: deriveBudgetLevelFromDb(userRow.budget_level),
    cuisines,
    allergies,
    transitionFromDiet: userRow.transition_from_diet ?? null,
    transitionToDiet: userRow.transition_to_diet ?? null,
  };
}

const deriveBudgetLevelFromDb = (value: UserRow["budget_level"]): BudgetLevel | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && value in DB_TO_BUDGET_LEVEL) {
    return DB_TO_BUDGET_LEVEL[value as BudgetLevelDbValue];
  }

  return normalizeBudgetLevel(value);
};

export async function saveCuisinePreferences(
  client: SupabaseClient,
  userId: string,
  region: string,
  cuisineNames: string[]
): Promise<void> {
  const normalizedRegion = region?.trim() ? region : null;
  const namesToSave = Array.from(new Set(cuisineNames));

  const { data: _updateData, error: updateError } = await client
    .from("users")
    .update({ region: normalizedRegion })
    .eq("id", userId);
  throwOnSupabaseError("saveCuisinePreferences:updateUser", updateError);

  const { data: _deleteCuisineData, error: deleteError } = await client
    .from("user_cuisines")
    .delete()
    .eq("user_id", userId);
  throwOnSupabaseError("saveCuisinePreferences:deleteUserCuisines", deleteError);

  if (!namesToSave.length) {
    return;
  }

  const cuisineRows = await ensureLookupRows(client, "cuisines", namesToSave);
  const idsByName = new Map<string, IdValue>(cuisineRows.map(({ id, name }) => [name, id]));
  const missing = namesToSave.filter((name) => !idsByName.has(name));

  if (missing.length) {
    throw new Error(`Unknown cuisines: ${missing.join(", ")}`);
  }

  const records = namesToSave.map((name) => {
    const cuisineId = idsByName.get(name);
    if (cuisineId === undefined) {
      throw new Error(`Missing cuisine id for ${name}`);
    }
    return {
      user_id: userId,
      cuisine_id: cuisineId,
    };
  });

  const { data: _insertCuisineData, error: insertError } = await client.from("user_cuisines").insert(records);
  throwOnSupabaseError("saveCuisinePreferences:insertUserCuisines", insertError);
}

export async function saveUserAllergies(
  client: SupabaseClient,
  userId: string,
  allergyNames: string[]
): Promise<void> {
  const namesToSave = Array.from(new Set(allergyNames));

  const { data: _deleteAllergyData, error: deleteError } = await client
    .from("user_allergies")
    .delete()
    .eq("user_id", userId);
  throwOnSupabaseError("saveUserAllergies:delete", deleteError);

  if (!namesToSave.length) {
    return;
  }

  const allergyRows = await ensureLookupRows(client, "allergies", namesToSave);
  const idsByName = new Map<string, IdValue>(allergyRows.map(({ id, name }) => [name, id]));
  const missing = namesToSave.filter((name) => !idsByName.has(name));

  if (missing.length) {
    throw new Error(`Unknown allergies: ${missing.join(", ")}`);
  }

  const records = namesToSave.map((name) => {
    const allergyId = idsByName.get(name);
    if (allergyId === undefined) {
      throw new Error(`Missing allergy id for ${name}`);
    }
    return {
      user_id: userId,
      allergy_id: allergyId,
    };
  });

  const { data: _insertAllergyData, error: insertError } = await client.from("user_allergies").insert(records);
  throwOnSupabaseError("saveUserAllergies:insert", insertError);
}

export async function saveBudgetPreference(
  client: SupabaseClient,
  userId: string,
  budgetLevel: BudgetLevel
): Promise<void> {
  const normalizedBudgetLevel = normalizeBudgetLevel(budgetLevel);
  const dbValue = BUDGET_LEVEL_TO_DB[normalizedBudgetLevel];
  const { data: _budgetData, error } = await client
    .from("users")
    .update({ budget_level: dbValue })
    .eq("id", userId);
  throwOnSupabaseError("saveBudgetPreference:update", error);
}

export async function saveDietTransitionPreferences(
  client: SupabaseClient,
  userId: string,
  transitionFromDiet: string | null,
  transitionToDiet: string | null,
): Promise<void> {
  const normalize = (value: string | null) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const normalizedFrom = normalize(transitionFromDiet);
  const normalizedTo = normalize(transitionToDiet);

  const { data: _dietTransitionData, error } = await client
    .from("users")
    .update({
      transition_from_diet: normalizedFrom,
      transition_to_diet: normalizedTo,
    })
    .eq("id", userId);

  throwOnSupabaseError("saveDietTransitionPreferences:update", error);
}
