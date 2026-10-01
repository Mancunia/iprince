import "server-only";
import { createClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/env";
import type { Database } from "./database.types";

/** Bypasses RLS. Only for validated public submissions, the cleanup job and owner-gated user management (auth-admin.ts). */
export function createServiceSupabase() {
  const env = readServerEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type ServiceClient = ReturnType<typeof createServiceSupabase>;
