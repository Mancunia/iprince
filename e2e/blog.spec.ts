import { expect, test } from "@playwright/test";
import { serviceDb, signIn } from "./helpers";

// 1×1 transparent PNG.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

test.afterAll(async () => {
  const db = serviceDb();
  await db.from("blog_posts").delete().like("slug", "e2e-%");
  await db.from("blog_categories").delete().like("slug", "e2e-%");
});

test("an admin publishes a post with a cover and visitors read it", async ({ page }) => {
  const stamp = Date.now();
  const categorySlug = `e2e-kategorie-${stamp}`;
  const categoryName = `E2E Kategorie ${stamp}`;
  const title = `E2E Artikel ${stamp}`;
  const slug = `e2e-artikel-${stamp}`;

  await signIn(page);
  await page.goto("/en/admin/blog/categories");
  await page.locator("#category-new-name-de").fill(categoryName);
  await page.locator("#category-new-slug").fill(categorySlug);
  await page.locator("#category-new-cta").selectOption("candidates");
  await page.getByRole("button", { name: "Add category" }).click();
  await expect(page.getByRole("heading", { name: categoryName })).toBeVisible();

  await page.goto("/en/admin/blog/new");
  await page.getByLabel("Title (DE)").fill(title);
  await expect(page.getByLabel("URL slug")).toHaveValue(slug);
  await page.getByLabel("Article (DE)").fill("## Abschnitt\n\nHallo **Welt**.");
  await page.getByLabel("Category").selectOption({ label: categoryName });
  await page.getByLabel("Status").selectOption("published");
  await page.getByRole("button", { name: "Create post" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/blog\/[0-9a-f-]{36}$/);
  await page.getByLabel("Upload cover").setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("button", { name: "Remove cover" })).toBeVisible({ timeout: 15_000 });

  await page.context().clearCookies();
  await page.goto("/de/blog");
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page).toHaveURL(new RegExp(`/de/blog/${slug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.getByRole("heading", { level: 2, name: "Abschnitt" })).toBeVisible();
  await expect(page.getByRole("main").locator("img").first()).toHaveAttribute("src", /public%2Fblog%2Fposts%2F/);
  await expect(page.getByRole("link", { name: "Beruf auswählen" })).toBeVisible();

  await page.goto(`/en/blog/${slug}`);
  await expect(page.getByText("This article is only available in German.")).toBeVisible();

  await page.goto(`/de/blog?category=${categorySlug}`);
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(1);
});

test("drafts, scheduled posts and bad pages stay hidden, even from a signed-in admin", async ({ page }) => {
  const stamp = Date.now();
  const draft = `e2e-entwurf-${stamp}`;
  const scheduled = `e2e-geplant-${stamp}`;
  const { error } = await serviceDb().from("blog_posts").insert([
    { slug: draft, title: { de: `E2E Entwurf ${stamp}`, en: "" }, status: "draft" },
    { slug: scheduled, title: { de: `E2E Geplant ${stamp}`, en: "" }, status: "published", published_at: new Date(Date.now() + 86_400_000).toISOString() },
  ]);
  if (error) throw error;

  for (const slug of [draft, scheduled]) {
    expect((await page.goto(`/de/blog/${slug}`))?.status()).toBe(404);
  }
  await page.goto("/de/blog");
  await expect(page.getByText(`E2E Geplant ${stamp}`)).toHaveCount(0);
  expect((await page.goto("/de/blog?page=999"))?.status()).toBe(404);
  expect((await page.goto("/de/blog?page=abc"))?.status()).toBe(404);

  await signIn(page);
  expect((await page.goto(`/de/blog/${scheduled}`))?.status()).toBe(404);
  await page.goto("/en/admin/blog?status=scheduled");
  await expect(page.getByRole("link", { name: `E2E Geplant ${stamp}` })).toBeVisible();
});
