"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabaseConfig";

export const createClient = (): SupabaseClient => {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
};
