import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers";

async function createProfession(page: Page, slug: string) {
  await page.goto("/en/admin/professions/new");
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("Name (DE)").fill("E2E Beruf");
  await page.getByLabel("Name (EN)").fill("E2E profession");
  await page.getByRole("button", { name: "Create profession" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/professions\/[0-9a-f-]+\/form$/);
}

test("an admin creates a profession, publishes its form and activates it", async ({ page }) => {
  const slug = `e2e-${Date.now()}`;
  await signIn(page);
  await createProfession(page, slug);

  await page.getByRole("button", { name: "Start editing" }).click();
  await page.getByRole("button", { name: "Add field" }).click();
  await page.getByRole("textbox", { name: "Label (DE)", exact: true }).fill("Spitzname");
  await page.getByRole("textbox", { name: "Label (EN)", exact: true }).fill("Nickname");
  await expect(page.getByRole("textbox", { name: "Key", exact: true })).toHaveValue("spitzname");

  await page.getByRole("combobox", { name: "New field type" }).selectOption("textarea");
  await page.getByRole("button", { name: "Add field" }).click();
  await page.getByRole("textbox", { name: "Label (DE)", exact: true }).fill("Motivation");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toHaveText("Draft saved.");

  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Version 1 is live.")).toBeVisible();

  await page.getByRole("link", { name: "Profession details" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/professions\/[0-9a-f-]+$/);
  const detailsUrl = page.url();
  await page.getByRole("checkbox", { name: "Active", exact: true }).check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");

  await page.goto(`/de/apply/${slug}`);
  await expect(page.getByLabel("Spitzname")).toBeVisible();
  await expect(page.getByLabel("Motivation")).toBeVisible();

  // Leave no active test profession behind.
  await page.goto(detailsUrl);
  await page.getByRole("checkbox", { name: "Active", exact: true }).uncheck();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
});

test("a profession cannot be activated without a published form", async ({ page }) => {
  await signIn(page);
  await createProfession(page, `e2e-inactive-${Date.now()}`);
  await page.getByRole("link", { name: "Profession details" }).click();
  await page.getByRole("checkbox", { name: "Active", exact: true }).check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Publish a form first.")).toBeVisible();
});

test("publishing with an empty label is refused and the field is flagged", async ({ page }) => {
  await signIn(page);
  await createProfession(page, `e2e-invalid-${Date.now()}`);
  await page.getByRole("button", { name: "Start editing" }).click();
  await page.getByRole("button", { name: "Add field" }).click();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByText("needs attention")).toBeVisible();
});
