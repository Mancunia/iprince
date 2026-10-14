import { describe, expect, it } from "vitest";
import { localizePost, postLocales, storedText } from "./text";

const post = (en: { title?: string; excerpt?: string; body?: string } = {}) => ({
  title: { de: "Titel", en: en.title ?? "" },
  excerpt: { de: "Kurz", en: en.excerpt ?? "" },
  body: { de: "Text", en: en.body ?? "" },
});

describe("storedText", () => {
  it("fills a missing language and survives garbage", () => {
    expect(storedText.parse({ de: "Hallo" })).toEqual({ de: "Hallo", en: "" });
    expect(storedText.parse(null)).toEqual({ de: "", en: "" });
  });
});

describe("postLocales", () => {
  it("lists English only with its own title and body", () => {
    expect(postLocales({ title: { de: "T", en: "T" }, body: { de: "B", en: "B" } })).toEqual(["de", "en"]);
    expect(postLocales({ title: { de: "T", en: "T" }, body: { de: "B", en: " " } })).toEqual(["de"]);
  });
});

describe("localizePost", () => {
  it("shows German on /de", () => {
    expect(localizePost(post({ title: "Title", body: "Body" }), "de")).toEqual({ title: "Titel", excerpt: "Kurz", body: "Text", fallback: false });
  });

  it("shows English when title and body exist", () => {
    expect(localizePost(post({ title: "Title", excerpt: "Short", body: "Body" }), "en")).toEqual({ title: "Title", excerpt: "Short", body: "Body", fallback: false });
  });

  it("falls back to German for the whole post when the English body is missing", () => {
    expect(localizePost(post({ title: "Title" }), "en")).toEqual({ title: "Titel", excerpt: "Kurz", body: "Text", fallback: true });
  });

  it("falls back when the English title is only whitespace", () => {
    expect(localizePost(post({ title: "   ", body: "Body" }), "en").fallback).toBe(true);
  });

  it("uses the German excerpt quietly when only the English excerpt is missing", () => {
    expect(localizePost(post({ title: "Title", body: "Body" }), "en")).toEqual({ title: "Title", excerpt: "Kurz", body: "Body", fallback: false });
  });
});
