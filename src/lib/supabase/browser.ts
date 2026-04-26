"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl, hasSupabaseEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  if (!hasSupabaseEnv()) return null;

  return createBrowserClient(
    getSupabaseUrl()!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
