import { describe, expect, it } from "vitest";
import { jsonLdString, localeAlternates, pageMetadata, sitemapEntries } from "./seo";

describe("localeAlternates", () => {
  it("links both languages and points x-default at English", () => {
    expect(localeAlternates("de", "/blog")).toEqual({
      canonical: "/de/blog",
      languages: { de: "/de/blog", en: "/en/blog", "x-default": "/en/blog" },
    });
  });

  it("uses the bare locale for the home page", () => {
    expect(localeAlternates("en", "").canonical).toBe("/en");
  });
});

describe("pageMetadata", () => {
  it("fills Open Graph and Twitter from the same title and description", () => {
    const meta = pageMetadata({ locale: "de", path: "/contact", title: "Kontakt", description: "Schreiben Sie uns." });
    expect(meta.alternates?.canonical).toBe("/de/contact");
    expect(meta.openGraph).toMatchObject({ type: "website", url: "/de/contact", title: "Kontakt", locale: "de_DE", siteName: "iPrince Recruiting" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "Kontakt" });
  });

  it("passes an image through to both cards", () => {
    const meta = pageMetadata({ locale: "en", path: "", title: "Home", image: "/cover.jpg" });
    expect(meta.openGraph?.images).toEqual([{ url: "/cover.jpg" }]);
    expect(meta.twitter?.images).toEqual(["/cover.jpg"]);
  });
});

describe("jsonLdString", () => {
  it("escapes < so a value cannot close the script tag", () => {
    expect(jsonLdString({ name: "</script><script>alert(1)</script>" })).not.toContain("<");
  });
});

describe("sitemapEntries", () => {
  const origin = new URL("https://iprince.de");
  const entries = sitemapEntries(origin, {
    professions: ["pflege"],
    posts: [{ slug: "visa-tipps", updatedAt: "2026-10-01T10:00:00Z" }],
  });

  it("lists every page in both languages with alternates", () => {
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://iprince.de/de");
    expect(urls).toContain("https://iprince.de/en/employers");
    expect(urls).toContain("https://iprince.de/de/apply/pflege");
    expect(urls).toContain("https://iprince.de/en/blog/visa-tipps");
    const home = entries.find((e) => e.url === "https://iprince.de/de");
    expect(home?.alternates?.languages).toEqual({ de: "https://iprince.de/de", en: "https://iprince.de/en" });
  });

  it("dates blog posts by their last update", () => {
    expect(entries.find((e) => e.url.endsWith("/de/blog/visa-tipps"))?.lastModified).toEqual(new Date("2026-10-01T10:00:00Z"));
  });
});
