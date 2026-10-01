import { expect, test } from "@playwright/test";
import { resetRateLimit, signIn, submitApplication } from "./helpers";

test("a candidate applies and an admin reviews the application", async ({ page }) => {
  const name = `E2E Candidate ${Date.now()}`;

  await resetRateLimit("apply");
  await submitApplication(page, name);
  await signIn(page);

  await page.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByText("Intensive care")).toBeVisible();
  const cvLink = page.getByRole("link", { name: /cv\.pdf$/ });
  await expect(cvLink).toBeVisible();
  const response = await page.request.get((await cvLink.getAttribute("href"))!);
  expect(response.status()).toBe(200);

  await page.locator("#review-status").selectOption("reviewing");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
});

test("unknown professions return 404", async ({ page }) => {
  const response = await page.goto("/en/apply/does-not-exist");
  expect(response?.status()).toBe(404);
});

test("admin pages require sign-in", async ({ page }) => {
  await page.goto("/en/admin/applications");
  await expect(page).toHaveURL(/\/en\/admin\/login$/);
});
