import { ensureAdmin } from "../scripts/lib/ensure-admin";

export const E2E_ADMIN = { email: "e2e-owner@iprince.local", password: "e2e-password-123" };

export default async function globalSetup() {
  const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(`e2e setup creates an owner with a known password; refusing to run against non-local Supabase (${host}).`);
  }
  await ensureAdmin({ ...E2E_ADMIN, role: "owner", displayName: "E2E Owner" });
}
