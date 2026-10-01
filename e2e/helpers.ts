import { expect, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./global-setup";

export async function signIn(page: Page, { email, password } = E2E_ADMIN) {
  await page.goto("/en/admin/login");
  await page.locator("#admin-email").fill(email);
  await page.locator("#admin-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/applications$/);
}
