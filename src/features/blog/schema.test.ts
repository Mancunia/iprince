import { describe, expect, it } from "vitest";
import { readCategoryForm, readPostForm, slugify, SLUG_PATTERN, toCategoryRow, toPostRow } from "./schema";

const NOW = new Date("2026-10-01T12:00:00.000Z");
const CATEGORY_ID = "14000000-0000-4000-8000-000000000001";

function postForm(overrides: Record<string, string> = {}, featured = false) {
  const data = new FormData();
  const values = {
    locale: "en", slug: "anerkennung", titleDe: "Anerkennung", titleEn: "", excerptDe: "", excerptEn: "",
    bodyDe: "Text", bodyEn: "", categoryId: "", authorName: "iPrince", status: "draft", publishedAt: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  if (featured) data.set("isFeatured", "on");
  return data;
}

describe("readPostForm", () => {
  it("accepts a German-only draft", () => {
    const result = readPostForm(postForm());
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ slug: "anerkennung", categoryId: "", isFeatured: false, status: "draft" });
  });

  it("reads the featured checkbox and trims text", () => {
    const result = readPostForm(postForm({ titleDe: "  Anerkennung  " }, true));
    expect(result.data?.titleDe).toBe("Anerkennung");
    expect(result.data?.isFeatured).toBe(true);
  });

  it.each([
    ["slug", "Anerkennung"],
    ["slug", "a--b"],
    ["slug", ""],
    ["slug", "a".repeat(81)],
    ["titleDe", "   "],
    ["status", "archived"],
    ["categoryId", "not-a-uuid"],
    ["publishedAt", "2026-02-30T10:00"],
    ["excerptDe", "x".repeat(301)],
    ["authorName", ""],
  ])("rejects %s=%j", (key, value) => {
    const result = readPostForm(postForm({ [key]: value }));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe(key);
  });
});

describe("toPostRow", () => {
  it("maps to columns and dates a post published now", () => {
    const parsed = readPostForm(postForm({ status: "published", categoryId: CATEGORY_ID, titleEn: "Recognition" }));
    expect(toPostRow(parsed.data!, NOW)).toEqual({
      slug: "anerkennung",
      title: { de: "Anerkennung", en: "Recognition" },
      excerpt: { de: "", en: "" },
      body: { de: "Text", en: "" },
      category_id: CATEGORY_ID,
      author_name: "iPrince",
      status: "published",
      published_at: NOW.toISOString(),
      is_featured: false,
    });
  });

  it("stores no category as null and converts a scheduled date", () => {
    const parsed = readPostForm(postForm({ status: "published", publishedAt: "2026-12-24T18:00" }));
    const row = toPostRow(parsed.data!, NOW);
    expect(row.category_id).toBeNull();
    expect(row.published_at).toBe("2026-12-24T17:00:00.000Z");
  });
});

describe("category form", () => {
  function categoryForm(overrides: Record<string, string> = {}) {
    const data = new FormData();
    for (const [key, value] of Object.entries({ slug: "karriere", nameDe: "Karriere", nameEn: "", cta: "candidates", ...overrides })) data.set(key, value);
    return data;
  }

  it("accepts a valid category and maps it to columns", () => {
    const result = readCategoryForm(categoryForm());
    expect(toCategoryRow(result.data!)).toEqual({ slug: "karriere", name: { de: "Karriere", en: "" }, cta: "candidates" });
  });

  it.each([["cta", "apply"], ["nameDe", ""], ["slug", "Karriere"]])("rejects %s=%j", (key, value) => {
    const result = readCategoryForm(categoryForm({ [key]: value }));
    expect(result.error?.issues[0].path[0]).toBe(key);
  });
});

describe("slugify", () => {
  it.each([
    ["Anerkennung als Pflegekraft: So geht's!", "anerkennung-als-pflegekraft-so-geht-s"],
    ["Über Größe", "ueber-groesse"],
    ["Café crème", "cafe-creme"],
    ["  --Hallo--  ", "hallo"],
    ["😀", ""],
  ])("%j → %j", (title, slug) => {
    expect(slugify(title)).toBe(slug);
  });

  it("caps the length and always yields a valid slug", () => {
    const slug = slugify("Wort ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug).toMatch(SLUG_PATTERN);
  });
});
