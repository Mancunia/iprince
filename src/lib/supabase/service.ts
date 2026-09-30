import "server-only";
import { createClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/env";
import type { Database } from "./database.types";

/** Bypasses RLS. Only for validated public submissions; never for admin code paths. */
export function createServiceSupabase() {
  const env = readServerEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type ServiceClient = ReturnType<typeof createServiceSupabase>;
