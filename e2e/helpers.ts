import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { E2E_ADMIN } from "./global-setup";

export async function signIn(page: Page, { email, password } = E2E_ADMIN) {
  await page.goto("/en/admin/login");
  await page.locator("#admin-email").fill(email);
  await page.locator("#admin-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/admin$/);
}

/** Service-role client for test setup and cleanup (bypasses RLS). */
export function serviceDb() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Locally every request has IP "unknown", so repeated runs would hit the hourly limit. */
export async function resetRateLimit(bucket: string) {
  const { error } = await serviceDb().from("rate_limits").delete().eq("bucket", bucket);
  if (error) throw error;
}

/** Fills and sends the seeded nursing application form. */
export async function submitApplication(page: Page, name: string) {
  await page.goto("/en/apply/pflege");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nursing & healthcare");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill("candidate@example.com");
  await page.getByLabel("German level").selectOption("B2");
  await page.getByLabel("Years of experience").fill("4");
  await page.getByLabel("Specialisation").selectOption("intensive");
  await page.getByLabel("Recognition process already started").check();
  await page.getByLabel("CV (PDF)").setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% e2e test\n") });
  await page.getByRole("button", { name: "Send application" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you", { timeout: 15_000 });
}
