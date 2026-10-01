import { expect, test } from "@playwright/test";

test.describe("phone width", () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test("the site menu lists the pages and closes with Escape", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("link", { name: "Employers" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("following a menu link navigates and closes the menu", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/en\/contact$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("an in-page menu link closes the menu", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "How it works" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
