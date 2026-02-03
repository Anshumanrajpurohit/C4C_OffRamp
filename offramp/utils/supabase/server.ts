import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabaseConfig";

type CookieStore = Awaited<ReturnType<typeof import("next/headers").cookies>>;

export const createClient = (cookieStore: CookieStore): SupabaseClient => {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Ignore set errors when invoked inside server components where cookies are read-only
          }
        });
      },
    },
  });
};
