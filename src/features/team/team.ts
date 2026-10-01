import { z } from "zod";
import type { Locale } from "@/i18n/config";

export const inviteInput = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  displayName: z.string().trim().min(1).max(80),
});

/** Where the invite email's link lands; the confirm route verifies the token and continues to `next`. */
export function inviteRedirectUrl(origin: string, locale: Locale): string {
  return `${origin}/api/auth/confirm?next=${encodeURIComponent(`/${locale}/admin/set-password`)}`;
}

export function canRemove(target: { userId: string; role: "owner" | "editor" }, actorUserId: string): boolean {
  return target.role === "editor" && target.userId !== actorUserId;
}

export function memberStatus(lastSignInAt: string | null | undefined): "active" | "pending" {
  return lastSignInAt ? "active" : "pending";
}
