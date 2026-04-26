import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, hasSupabaseAdminEnv } from "@/lib/env";

export function createAdminSupabaseClient() {
  if (!hasSupabaseAdminEnv()) return null;

  return createClient(
    getSupabaseUrl()!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
