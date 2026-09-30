import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { readPublicEnv } from "@/env";
import type { Database } from "./database.types";

/**
 * Refreshes the auth session cookies on `response` and reports who is signed in.
 * Refreshed cookies are written to the response only; Server Components in the same request still see the old
 * refresh token, which relies on Supabase Auth `refresh_token_reuse_interval` > 0 (default 10s). See README.
 */
export async function updateSession(request: NextRequest, response: NextResponse) {
  const env = readPublicEnv();
  const supabase = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  return { response, userId: data.user?.id ?? null };
}
