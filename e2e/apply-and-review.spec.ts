import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "./global-setup";

test("a candidate applies and an admin reviews the application", async ({ page }) => {
  const name = `E2E Candidate ${Date.now()}`;

  await page.goto("/en/apply/pflege");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nursing & healthcare");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill("candidate@example.com");
  await page.getByLabel("German level").selectOption("B2");
  await page.getByLabel("Years of experience").fill("4");
  await page.getByLabel("Specialisation").selectOption("intensive");
  await page.getByLabel("Recognition process already started").check();
  await page.getByLabel("CV (PDF)").setInputFiles({
    name: "cv.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% e2e test\n"),
  });
  await page.getByRole("button", { name: "Send application" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you", { timeout: 15_000 });

  await page.goto("/en/admin/login");
  await page.locator("#admin-email").fill(E2E_ADMIN.email);
  await page.locator("#admin-password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/applications$/);

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
