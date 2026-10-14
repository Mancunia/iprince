import { expect, test, type Page } from "@playwright/test";
import { serviceDb } from "./helpers";

test.afterAll(async () => {
  await serviceDb().from("blog_posts").delete().like("slug", "e2e-seo-%");
});

test("the sitemap lists live posts in the languages they are written in, but no drafts", async ({ request }) => {
  const stamp = Date.now();
  const live = `e2e-seo-live-${stamp}`;
  const draft = `e2e-seo-draft-${stamp}`;
  const germanOnly = `e2e-seo-de-${stamp}`;
  const post = (slug: string, status: "published" | "draft", english = true) => ({
    slug,
    status,
    title: english ? { de: slug, en: slug } : { de: slug },
    excerpt: { de: "" },
    body: english ? { de: "Text", en: "Text" } : { de: "Text" },
    author_name: "E2E",
    published_at: status === "published" ? new Date(Date.now() - 60_000).toISOString() : null,
  });
  const { error } = await serviceDb().from("blog_posts").insert([post(live, "published"), post(draft, "draft"), post(germanOnly, "published", false)]);
  expect(error).toBeNull();

  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain(`/de/blog/${live}</loc>`);
  expect(xml).toContain(`/en/blog/${live}</loc>`);
  expect(xml).toContain('hreflang="de"');
  expect(xml).not.toContain(draft);
  expect(xml).toContain(`/de/blog/${germanOnly}</loc>`);
  expect(xml).not.toContain(`/en/blog/${germanOnly}`);
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

/** Blocks the CookieScript CDN and records (and stubs) every Google tag request. */
async function watchGoogleTag(page: Page) {
  const requests: string[] = [];
  await page.route("https://cdn.cookie-script.com/**", (route) => route.abort());
  await page.route("https://www.googletagmanager.com/**", (route) => {
    requests.push(route.request().url());
    return route.fulfill({ contentType: "text/javascript", body: "" });
  });
  return requests;
}

test.describe("Google Analytics", () => {
  test("never loads before the visitor consents", async ({ page }) => {
    const requests = await watchGoogleTag(page);
    await page.goto("/de");
    await page.waitForLoadState("networkidle");
    expect(await page.locator("script#cookiescript").count(), "dev server needs COOKIESCRIPT_ID (see playwright.config.ts)").toBe(1);
    expect(requests).toEqual([]);
    expect(await page.evaluate(() => typeof window.gtag)).toBe("undefined");
  });

  test("loads once the performance category is accepted", async ({ page }) => {
    const requests = await watchGoogleTag(page);
    // Stand-in for the CookieScript banner with a stored "accept performance" choice.
    await page.addInitScript(() => {
      window.CookieScript = {
        instance: {
          show() {},
          acceptAction() {},
          applyTranslationByCode() {},
          currentState: () => ({ action: "accept", categories: ["strict", "performance"] }),
        },
      };
    });
    await page.goto("/de");
    await expect.poll(() => requests).toEqual([expect.stringContaining("gtag/js?id=G-E2ETEST1")]);
    const config = await page.evaluate(() => (window.dataLayer ?? []).map((args) => Array.from(args as ArrayLike<unknown>)[0]));
    expect(config).toEqual(["consent", "js", "config"]);
  });
});
