import { createBrowserClient } from "@supabase/ssr";
import { readPublicEnv } from "@/env";
import type { Database } from "./database.types";

export function createBrowserSupabase() {
  const env = readPublicEnv();
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
