const PRIMARY_URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const FALLBACK_URL_KEY = "SUPABASE_URL";
const PRIMARY_PUBLISHABLE_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY";
const PRIMARY_ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
const FALLBACK_ANON_KEY = "SUPABASE_ANON_KEY";
const SERVICE_ROLE_KEY = "SUPABASE_SERVICE_ROLE_KEY";

export function getSupabaseUrl() {
  const url =
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim() ||
    (process.env.SUPABASE_URL || "").trim();

  if (!url) {
    throw new Error(
      `Missing Supabase project URL. Define ${PRIMARY_URL_KEY} in your environment (fallback: ${FALLBACK_URL_KEY}).`,
    );
  }

  return url;
}

export function getSupabaseAnonKey() {
  const anonKey =
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "").trim() ||
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() ||
    (process.env.SUPABASE_ANON_KEY || "").trim();

  if (!anonKey) {
    throw new Error(
      `Missing Supabase anon/publishable key. Define ${PRIMARY_PUBLISHABLE_KEY} or ${PRIMARY_ANON_KEY} (fallback: ${FALLBACK_ANON_KEY}).`,
    );
  }

  return anonKey;
}

export function getSupabaseServiceRoleKey() {
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!serviceRoleKey) {
    throw new Error(`Missing Supabase service role key. Define ${SERVICE_ROLE_KEY} in your environment.`);
  }

  return serviceRoleKey;
}
