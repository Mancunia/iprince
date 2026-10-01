import { expect, test } from "@playwright/test";
import { ensureAdmin } from "../scripts/lib/ensure-admin";
import { signIn } from "./helpers";

const EDITOR = { email: "e2e-content-editor@iprince.local", password: "e2e-password-123" };
// 1×1 transparent PNG.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

test.beforeAll(async () => {
  await ensureAdmin({ ...EDITOR, role: "editor", displayName: "E2E Content Editor" });
});

test("an admin edits the hero and resets it to the default", async ({ page }) => {
  const title = `E2E Hero ${Date.now()}`;
  await signIn(page);
  await page.goto("/en/admin/content");
  await page.getByRole("link", { name: "Edit" }).first().click();
  await expect(page).toHaveURL(/\/en\/admin\/content\/hero$/);

  await page.getByLabel("Title (DE)").fill(title);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
  await page.goto("/de");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

  await page.goto("/en/admin/content/hero");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset to default" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/content$/);
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your path to a successful career in Germany");
});

test("an editor cannot open the legal editor", async ({ page }) => {
  await signIn(page, EDITOR);
  await page.goto("/en/admin/content");
  await expect(page.getByText("Only the owner can edit this page.").first()).toBeVisible();
  const response = await page.goto("/en/admin/content/privacy");
  expect(response?.status()).toBe(404);
});

test("the owner uploads and removes a hero photo", async ({ page }) => {
  await signIn(page);
  await page.goto("/en/admin/content/photos");
  // Start clean even if an earlier run left a photo behind.
  const leftover = page.getByRole("button", { name: "Remove photo" });
  if (await leftover.count()) {
    page.once("dialog", (dialog) => dialog.accept());
    await leftover.first().click();
    await expect(leftover).toHaveCount(0, { timeout: 15_000 });
  }
  await page.getByLabel("Hero: Upload photo").setInputFiles({ name: "hero.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("button", { name: "Remove photo" })).toBeVisible({ timeout: 15_000 });

  await page.goto("/en");
  const hero = page.getByRole("img", { name: "Skilled worker starting a new job in Germany" });
  await expect(hero).toHaveAttribute("src", /storage%2Fv1%2Fobject%2Fpublic%2Fsite%2Fhero%2F/);

  await page.goto("/en/admin/content/photos");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remove photo" }).click();
  // Other slots also say "No photo yet", so wait for the hero's own upload control to come back.
  await expect(page.getByLabel("Hero: Upload photo")).toBeAttached({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Remove photo" })).toHaveCount(0);
});

test("legal pages render, are linked from the footer and fall back to German", async ({ page }) => {
  await page.goto("/de");
  await page.getByRole("contentinfo").getByRole("link", { name: "Impressum" }).click();
  await expect(page).toHaveURL(/\/de\/imprint$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Impressum");

  await page.goto("/en");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy policy" }).click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
  await expect(page.getByText("This page is only available in German.")).toHaveCount(0);

  await signIn(page);
  await page.goto("/en/admin/content/privacy");
  await page.getByRole("button", { name: "English" }).click();
  const english = page.getByLabel("Text (EN)");
  const original = await english.inputValue();
  await english.fill("");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");

  await page.goto("/en/privacy");
  await expect(page.getByText("This page is only available in German.")).toBeVisible();
  await expect(page.locator("[lang=de]").getByRole("heading", { name: "1. Verantwortlicher" })).toBeVisible();

  await page.goto("/en/admin/content/privacy");
  await page.getByRole("button", { name: "English" }).click();
  await page.getByLabel("Text (EN)").fill(original);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
});
