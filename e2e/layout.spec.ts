import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { signIn } from "./helpers";

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

  test("a tap on the menu's own padding keeps it open", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog");
    const box = (await menu.boundingBox())!;
    // Bottom padding, centred: away from the rounded corners, which are backdrop.
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 12);
    await expect(menu).toBeVisible();
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

test.describe("admin at phone width", () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test("the drawer opens with the section links and closes after navigating", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("link", { name: "Professions" })).toBeVisible();
    await drawer.getByRole("link", { name: /^Enquiries/ }).click();
    await expect(page).toHaveURL(/\/en\/admin\/leads$/);
    await expect(drawer).toBeHidden();
  });

  test("the drawer is announced as the admin navigation", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog", { name: "Admin navigation" })).toBeVisible();
  });

  test("the drawer closes with Escape", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test("the hero never claims availability when there are no open positions", async ({ page }) => {
  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: before, error } = await supabase.from("professions").select("id, open_positions").gt("open_positions", 0);
  if (error) throw error;
  try {
    for (const row of before) await supabase.from("professions").update({ open_positions: 0 }).eq("id", row.id);
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Available now")).toHaveCount(0);
  } finally {
    for (const row of before) await supabase.from("professions").update({ open_positions: row.open_positions }).eq("id", row.id);
  }
});
