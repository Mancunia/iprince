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

  for (const path of ["/de", "/de/employers", "/de/contact", "/de/apply/pflege"]) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test("the home page shows its sections and requests no missing images", async ({ page }) => {
  const failed: string[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) failed.push(response.url());
  });
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 2, name: "We find the job that suits your skills" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contact us" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(failed).toEqual([]);
});
