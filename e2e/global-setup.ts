import { ensureAdmin } from "../scripts/lib/ensure-admin";

export const E2E_ADMIN = { email: "e2e-owner@iprince.local", password: "e2e-password-123" };

export default async function globalSetup() {
  await ensureAdmin({ ...E2E_ADMIN, role: "owner", displayName: "E2E Owner" });
}
