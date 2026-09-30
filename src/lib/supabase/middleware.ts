import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "./database.types";

/**
 * Updates the user's Supabase session in Next.js middleware.
 * Ensures cookies stay fresh across SSR and Client navigation.
 *
 * @param request The incoming NextRequest
 * @param initialResponse Optional existing NextResponse (e.g. from next-intl middleware)
 * @returns The NextResponse with updated cookie headers
 */
export async function updateSession(
  request: NextRequest,
  initialResponse?: NextResponse
): Promise<NextResponse> {
  let supabaseResponse =
    initialResponse ??
    NextResponse.next({
      request,
    });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Gracefully pass through if credentials are not configured yet
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("your-project")
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        if (!initialResponse) {
          supabaseResponse = NextResponse.next({
            request,
          });
        }
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Calling getUser() refreshes expired tokens and updates auth cookies
  await supabase.auth.getUser();

  return supabaseResponse;
}
