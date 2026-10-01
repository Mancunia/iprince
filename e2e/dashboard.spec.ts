import { expect, test } from "@playwright/test";
import { resetRateLimit, signIn, submitApplication } from "./helpers";

test("the dashboard counts a new application and links to the filtered list", async ({ page }) => {
  const name = `E2E Dashboard ${Date.now()}`;
  await resetRateLimit("apply");
  await submitApplication(page, name);
  await signIn(page);

  const card = page.getByRole("link", { name: /New applications/ });
  const count = Number((await card.locator(".stat-value").textContent())?.replace(/\D/g, ""));
  expect(count).toBeGreaterThanOrEqual(1);
  await expect(page.getByRole("link", { name })).toBeVisible();

  await card.click();
  await expect(page).toHaveURL(/\/en\/admin\/applications\?status=new$/);
  await expect(page.getByRole("link", { name })).toBeVisible();
  await expect(page.getByRole("link", { name: "New", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "All statuses" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/applications$/);
  await page.goto("/en/admin/applications?status=bogus");
  await expect(page.getByRole("link", { name: "All statuses" })).toHaveAttribute("aria-current", "page");
});
