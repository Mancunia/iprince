import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { signIn } from "./helpers";

// Locally every request has IP "unknown", so repeated runs would hit the 5/h limit.
test.beforeAll(async () => {
  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from("rate_limits").delete().in("bucket", ["lead", "contact"]);
  if (error) throw error;
});

test("an employer enquiry and a contact message reach the admin inbox", async ({ page }) => {
  const stamp = Date.now();
  const company = `E2E Company ${stamp}`;
  const sender = `E2E Sender ${stamp}`;

  await page.goto("/en/employers");
  await page.getByLabel("Company").fill(company);
  await page.getByLabel("Contact person").fill("Erika Muster");
  await page.getByLabel("Email").fill("employer@example.com");
  await page.getByLabel("Nursing & healthcare").check();
  await page.getByLabel("How many people do you need? (optional)").fill("3");
  await page.getByLabel("Message (optional)").fill("Line one\nLine two");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you");

  await page.goto("/en/contact");
  await page.getByLabel("Name").fill(sender);
  await page.getByLabel("Email").fill("sender@example.com");
  await page.getByLabel("Message").fill("Do you place electricians?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you");

  await signIn(page);
  await expect(page.getByRole("link", { name: /^Enquiries\s*\d+$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Messages\s*\d+$/ })).toBeVisible();

  await page.goto("/en/admin/leads");
  await page.getByRole("link", { name: company }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(company);
  await expect(page.getByText("Nursing & healthcare")).toBeVisible();
  await page.locator("#lead-status").selectOption("contacted");
  await page.locator("#lead-notes").fill("Called back");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");

  await page.goto("/en/admin/messages");
  await page.getByRole("link", { name: sender }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(sender);
  await expect(page.getByText("Do you place electricians?")).toBeVisible();
  await page.locator("#message-status").selectOption("read");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/messages$/);
  await expect(page.getByRole("link", { name: sender })).toHaveCount(0);
});

test("a contact form with the honeypot filled pretends success and stores nothing", async ({ page }) => {
  const bot = `E2E Bot ${Date.now()}`;
  await page.goto("/en/contact");
  await page.getByLabel("Name").fill(bot);
  await page.getByLabel("Email").fill("bot@example.com");
  await page.getByLabel("Message").fill("spam");
  // The trap is inert and hidden, so set it directly like a bot would.
  await page.locator('input[name="hp_field"]').evaluate((el: HTMLInputElement) => { el.value = "http://spam.test"; });
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you");

  await signIn(page);
  await page.goto("/en/admin/messages");
  await expect(page.getByRole("link", { name: bot })).toHaveCount(0);
});

test("admin inbox pages require sign-in", async ({ page }) => {
  await page.goto("/en/admin/leads");
  await expect(page).toHaveURL(/\/en\/admin\/login$/);
});
