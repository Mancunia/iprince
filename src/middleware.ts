import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Direct redirect for unprefixed /admin routes to /en/admin
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.redirect(url);
  }

  // First handle i18n routing
  const response = handleI18nRouting(request);

  // Then update and refresh Supabase auth session cookies
  return await updateSession(request, response);
}

export const config = {
  matcher: ["/", "/(de|en)/:path*", "/admin", "/admin/:path*"],
};
