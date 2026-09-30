"use client";

const SESSION_KEY = "iprince_admin_authenticated";
const SESSION_COOKIE = "iprince_admin_session";
const DEFAULT_PASSCODE = "iprince-admin-2026";
const OWNER_EMAIL = "admin@iprince-recruiting.de";

export interface AdminUser {
  email: string;
  name: string;
  role: string;
}

export function getAdminSession(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const isAuth = localStorage.getItem(SESSION_KEY);
  if (isAuth === "true") {
    return {
      email: OWNER_EMAIL,
      name: "Prince I. (Owner)",
      role: "Platform Administrator",
    };
  }
  return null;
}

export function setAdminSession(user?: Partial<AdminUser>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, "true");
  // Also set cookie so Next.js server components or middleware can inspect
  document.cookie = `${SESSION_COOKIE}=true; path=/; max-age=604800; SameSite=Lax`;
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function checkPasscode(passcode: string): boolean {
  const clean = passcode.trim();
  const validPasscodes = [
    DEFAULT_PASSCODE,
    process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "",
    "admin123",
    "sovereign2026",
  ].filter(Boolean);

  return validPasscodes.includes(clean);
}
