"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabaseConfig";

let supabaseBrowserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient(
      getSupabaseUrl(),
      getSupabaseAnonKey()
    );
  }

  return supabaseBrowserClient;
}

export const supabase = getSupabaseBrowserClient();
