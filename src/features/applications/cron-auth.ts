import { timingSafeEqual } from "node:crypto";

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Constant-time comparison. */
export function isAuthorizedCron(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
