const PROTECTED = /^\/(de|en)\/admin(?!\/(?:login|accept-invite)(?:\/|$))(\/|$)/;

export function isProtectedAdminPath(pathname: string): boolean {
  return PROTECTED.test(pathname);
}

export function adminLoginPath(pathname: string): string {
  const locale = pathname.split("/")[1];
  return `/${locale}/admin/login`;
}

const SAFE_NEXT = /^\/(de|en)\/admin(\/[a-z0-9-]+)*$/;

/** Redirect target after an emailed link: only this site's admin paths, never another origin. */
export function safeNextPath(next: string | null): string {
  return next && SAFE_NEXT.test(next) ? next : "/de/admin";
}
