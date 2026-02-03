"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "./supabaseConfig";

let supabaseBrowserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
  }

  return supabaseBrowserClient;
}
