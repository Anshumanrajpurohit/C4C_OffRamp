import type { SupabaseClient } from "@supabase/supabase-js";

export type BudgetLevel = 1 | 2 | 3;

export type UserPreferences = {
  region: string | null;
  budgetLevel: BudgetLevel | null;
  cuisines: string[];
  allergies: string[];
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
type UserRow = { region: string | null; budget_level: number | null };

const isBudgetLevelValue = (value: unknown): value is BudgetLevel => value === 1 || value === 2 || value === 3;

const DEFAULT_PREFERENCES: UserPreferences = {
  region: null,
  budgetLevel: null,
  cuisines: [],
  allergies: [],
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
  if (error) {
    throw error;
  }

  return ((data ?? []) as LookupRow[]);
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

  if (junctionError) {
    throw junctionError;
  }

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

  if (lookupError) {
    throw lookupError;
  }

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
    .select("region, budget_level")
    .eq("id", userId)
    .maybeSingle<UserRow>();

  if (userError) {
    throw userError;
  }

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
    budgetLevel: isBudgetLevelValue(userRow.budget_level) ? (userRow.budget_level as BudgetLevel) : null,
    cuisines,
    allergies,
  };
}

export async function saveCuisinePreferences(
  client: SupabaseClient,
  userId: string,
  region: string,
  cuisineNames: string[]
): Promise<void> {
  const normalizedRegion = region?.trim() ? region : null;
  const namesToSave = Array.from(new Set(cuisineNames));

  const { error: updateError } = await client
    .from("users")
    .update({ region: normalizedRegion })
    .eq("id", userId);

  if (updateError) {
    throw updateError;
  }

  const { error: deleteError } = await client.from("user_cuisines").delete().eq("user_id", userId);
  if (deleteError) {
    throw deleteError;
  }

  if (!namesToSave.length) {
    return;
  }

  const cuisineRows = await fetchIdsByNames(client, "cuisines", namesToSave);
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

  const { error: insertError } = await client.from("user_cuisines").insert(records);
  if (insertError) {
    throw insertError;
  }
}

export async function saveUserAllergies(
  client: SupabaseClient,
  userId: string,
  allergyNames: string[]
): Promise<void> {
  const namesToSave = Array.from(new Set(allergyNames));

  const { error: deleteError } = await client.from("user_allergies").delete().eq("user_id", userId);
  if (deleteError) {
    throw deleteError;
  }

  if (!namesToSave.length) {
    return;
  }

  const allergyRows = await fetchIdsByNames(client, "allergies", namesToSave);
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

  const { error: insertError } = await client.from("user_allergies").insert(records);
  if (insertError) {
    throw insertError;
  }
}

export async function saveBudgetPreference(
  client: SupabaseClient,
  userId: string,
  budgetLevel: BudgetLevel
): Promise<void> {
  const { error } = await client.from("users").update({ budget_level: budgetLevel }).eq("id", userId);
  if (error) {
    throw error;
  }
}
