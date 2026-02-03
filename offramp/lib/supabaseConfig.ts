const PRIMARY_URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const FALLBACK_URL_KEY = "SUPABASE_URL";
const PRIMARY_PUBLISHABLE_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY";
const PRIMARY_ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
const FALLBACK_ANON_KEY = "SUPABASE_ANON_KEY";
const SERVICE_ROLE_KEY = "SUPABASE_SERVICE_ROLE_KEY";

function readEnv(key: string) {
  return process.env[key]?.trim() || "";
}

export function getSupabaseUrl() {
  const url = readEnv(PRIMARY_URL_KEY) || readEnv(FALLBACK_URL_KEY);

  if (!url) {
    throw new Error(
      `Missing Supabase project URL. Define ${PRIMARY_URL_KEY} in your environment (fallback: ${FALLBACK_URL_KEY}).`,
    );
  }

  return url;
}

export function getSupabaseAnonKey() {
  const anonKey =
    readEnv(PRIMARY_PUBLISHABLE_KEY) ||
    readEnv(PRIMARY_ANON_KEY) ||
    readEnv(FALLBACK_ANON_KEY);

  if (!anonKey) {
    throw new Error(
      `Missing Supabase anon/publishable key. Define ${PRIMARY_PUBLISHABLE_KEY} or ${PRIMARY_ANON_KEY} (fallback: ${FALLBACK_ANON_KEY}).`,
    );
  }

  return anonKey;
}

export function getSupabaseServiceRoleKey() {
  const serviceRoleKey = readEnv(SERVICE_ROLE_KEY);

  if (!serviceRoleKey) {
    throw new Error(`Missing Supabase service role key. Define ${SERVICE_ROLE_KEY} in your environment.`);
  }

  return serviceRoleKey;
}
