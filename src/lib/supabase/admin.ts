import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Creates an admin Supabase client utilizing the Service Role Key.
 * This client bypasses Row Level Security (RLS).
 *
 * CAUTION: Only invoke this on the server side (Server Actions, Route Handlers).
 * Never import or use this in Client Components or expose the service role key to the browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
