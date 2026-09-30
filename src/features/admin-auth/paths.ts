const PROTECTED = /^\/(de|en)\/admin(?!\/login)(\/|$)/;

export function isProtectedAdminPath(pathname: string): boolean {
  return PROTECTED.test(pathname);
}

export function adminLoginPath(pathname: string): string {
  const locale = pathname.split("/")[1];
  return `/${locale}/admin/login`;
}
