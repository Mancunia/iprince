import { NextResponse, type NextRequest } from "next/server";
import { adminLoginPath, safeNextPath } from "@/features/admin-auth/paths";

// Under /api so the i18n proxy leaves it alone. This GET must not spend the one-time token: email link
// scanners prefetch links. It forwards to an interstitial page whose button runs the verification.
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNextPath(params.get("next"));
  const tokenHash = params.get("token_hash");

  if (tokenHash && params.get("type") === "invite") {
    const locale = next.split("/")[1];
    const target = new URL(`/${locale}/admin/accept-invite`, request.url);
    target.searchParams.set("token_hash", tokenHash);
    target.searchParams.set("next", next);
    return NextResponse.redirect(target);
  }
  return NextResponse.redirect(new URL(`${adminLoginPath(next)}?notice=invite_expired`, request.url));
}
