import { NextResponse, type NextRequest } from "next/server";
import { adminLoginPath, safeNextPath } from "@/features/admin-auth/paths";
import { createServerSupabase } from "@/lib/supabase/server";

// Under /api so the i18n proxy leaves it alone. verifyOtp sets the session cookies via cookies(),
// which Next applies to the redirect response.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNextPath(params.get("next"));
  const tokenHash = params.get("token_hash");

  if (tokenHash && params.get("type") === "invite") {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.verifyOtp({ type: "invite", token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.error("invite verification failed", error.code ?? error.status);
  }
  return NextResponse.redirect(new URL(`${adminLoginPath(next)}?notice=invite_expired`, request.url));
}
