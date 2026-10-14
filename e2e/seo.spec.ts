import { expect, test } from "@playwright/test";
import { serviceDb } from "./helpers";

test.afterAll(async () => {
  await serviceDb().from("blog_posts").delete().like("slug", "e2e-seo-%");
});

test("the sitemap lists live posts in both languages but no drafts", async ({ request }) => {
  const stamp = Date.now();
  const live = `e2e-seo-live-${stamp}`;
  const draft = `e2e-seo-draft-${stamp}`;
  const post = (slug: string, status: "published" | "draft") => ({
    slug,
    status,
    title: { de: slug },
    excerpt: { de: "" },
    body: { de: "Text" },
    author_name: "E2E",
    published_at: status === "published" ? new Date(Date.now() - 60_000).toISOString() : null,
  });
  const { error } = await serviceDb().from("blog_posts").insert([post(live, "published"), post(draft, "draft")]);
  expect(error).toBeNull();

  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain(`/de/blog/${live}</loc>`);
  expect(xml).toContain(`/en/blog/${live}</loc>`);
  expect(xml).toContain('hreflang="de"');
  expect(xml).not.toContain(draft);
});

test("robots.txt keeps non-production deployments out of the index", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toMatch(/Disallow: \/\s*$/m);
});

test("public pages carry hreflang links and structured data", async ({ page }) => {
  await page.goto("/de");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/de$/);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", /\/en$/);
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute("href", /\/en$/);
  const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  expect(jsonLd["@type"]).toBe("Organization");

  await page.goto("/en/contact");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
  await expect(page).toHaveTitle(/ · /);
});

test("admin pages ask search engines not to index them", async ({ page }) => {
  await page.goto("/en/admin/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
