import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import { CONTENT_KEYS, contentSchemas, defaults, keyFromSlug, photoPathFor, resolveContent, SECTION_SLUGS, whatsappHref } from "./content";

describe("defaults", () => {
  it.each(CONTENT_KEYS)("%s default satisfies its schema", (key) => {
    expect(contentSchemas[key].safeParse(defaults[key]).success).toBe(true);
  });

  it("uses today's home copy", () => {
    expect(defaults["home.hero"].title.en).toBe(en.home.title);
    expect(defaults["home.steps"].apply.text.en).toBe(en.home.steps.apply.text);
    expect(defaults.photos.hero.alt.en).toBe(en.home.heroAlt);
    expect(defaults.photos.hero.path).toBeNull();
  });
});

describe("resolveContent", () => {
  it("returns defaults when there are no rows", () => expect(resolveContent([])).toEqual(defaults));

  it("uses a valid stored value", () => {
    const hero = { kicker: { de: "K", en: "" }, title: { de: "T", en: "Title" }, lead: { de: "L", en: "" } };
    expect(resolveContent([{ key: "home.hero", value: hero }])["home.hero"]).toEqual(hero);
  });

  it("falls back per key on invalid values", () => {
    const invalid: string[] = [];
    const content = resolveContent(
      [{ key: "home.hero", value: { title: 42 } }, { key: "contact", value: { whatsapp: "+49 30 1234567" } }],
      (key) => invalid.push(key),
    );
    expect(content["home.hero"]).toEqual(defaults["home.hero"]);
    expect(content.contact.whatsapp).toBe("+49 30 1234567");
    expect(invalid).toEqual(["home.hero"]);
  });

  it("ignores unknown keys", () => expect(resolveContent([{ key: "other", value: {} }])).toEqual(defaults));
});

describe("contact schema", () => {
  const parse = (value: unknown) => contentSchemas.contact.safeParse(value);
  it("accepts a number with 7–15 digits", () => expect(parse({ whatsapp: "+49 173 9018671" }).success).toBe(true));
  it("rejects too few digits", () => expect(parse({ whatsapp: "+49 12" }).success).toBe(false));
  it("rejects a bad email", () => expect(parse({ whatsapp: "+49 173 9018671", email: "nope" }).success).toBe(false));
  it("allows an empty email and address", () => {
    expect(parse({ whatsapp: "+49 173 9018671", email: "", address: "" }).success).toBe(true);
  });
});

describe("text schemas", () => {
  it("require German", () => {
    const value = { kicker: { de: "", en: "K" }, title: { de: "T" }, lead: { de: "L" } };
    expect(contentSchemas["home.hero"].safeParse(value).success).toBe(false);
  });
  it("cap length", () => {
    const value = { kicker: { de: "K" }, title: { de: "x".repeat(201) }, lead: { de: "L" } };
    expect(contentSchemas["home.hero"].safeParse(value).success).toBe(false);
  });
});

describe("slugs", () => {
  it("are unique and dot-free", () => {
    const slugs = Object.values(SECTION_SLUGS);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z]+$/);
  });
  it("map back to keys", () => {
    expect(keyFromSlug("privacy")).toBe("legal.privacy");
    expect(keyFromSlug("hero")).toBe("home.hero");
    expect(keyFromSlug("legal.privacy")).toBeNull();
  });
});

describe("whatsappHref", () => {
  it("keeps only digits", () => expect(whatsappHref("+49 173 9018671")).toBe("https://wa.me/491739018671"));
});

describe("photoPathFor", () => {
  const ok = "hero/0b6f3c3e-8c4a-4a53-9a43-1f2d3c4b5a69.webp";
  it("accepts a uuid file in the slot's folder", () => expect(photoPathFor("hero").test(ok)).toBe(true));
  it.each([
    "steps/0b6f3c3e-8c4a-4a53-9a43-1f2d3c4b5a69.webp",
    "hero/../steps/0b6f3c3e-8c4a-4a53-9a43-1f2d3c4b5a69.webp",
    "hero/0b6f3c3e-8c4a-4a53-9a43-1f2d3c4b5a69.svg",
    "hero/evil.jpg",
    `x${ok}`,
  ])("rejects %s", (path) => expect(photoPathFor("hero").test(path)).toBe(false));
});
