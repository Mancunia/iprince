import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { adminLoginPath, isProtectedAdminPath } from "@/features/admin-auth/paths";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const handleI18n = createMiddleware(routing);

// Optimistic check only. Real authorization is requireAdmin() on the server.
export default async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request, handleI18n(request));
  const { pathname } = request.nextUrl;
  if (!userId && isProtectedAdminPath(pathname)) {
    return NextResponse.redirect(new URL(adminLoginPath(pathname), request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
