import { describe, expect, it } from "vitest";
import { parseSectionForm, unflatten } from "./form-data";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(entries)) data.append(k, v);
  return data;
};

describe("unflatten", () => {
  it("nests dotted names", () => {
    expect(unflatten(form({ "match.title.de": "T", "match.title.en": "", whatsapp: "1" }))).toEqual({
      match: { title: { de: "T", en: "" } },
      whatsapp: "1",
    });
  });
  it("ignores control fields and unsafe names", () => {
    expect(unflatten(form({ locale: "de", section: "hero", "__proto__.x": "1", "a..b": "2", $ACTION_ID_1: "" }))).toEqual({});
  });
});

describe("parseSectionForm", () => {
  it("parses the hero", () => {
    const result = parseSectionForm("home.hero", form({
      "kicker.de": " K ", "kicker.en": "", "title.de": "T", "title.en": "Title", "lead.de": "L", "lead.en": "",
    }));
    expect(result).toEqual({ success: true, data: { kicker: { de: "K", en: "" }, title: { de: "T", en: "Title" }, lead: { de: "L", en: "" } } });
  });

  it("reports the full field path", () => {
    const result = parseSectionForm("home.features", form({
      "match.eyebrow.de": "E", "match.title.de": "", "match.text.de": "X",
      "advisors.eyebrow.de": "E", "advisors.title.de": "T", "advisors.text.de": "X", "advisors.badgeTitle.de": "B", "advisors.badgeText.de": "B",
    }));
    expect(result).toEqual({ success: false, fieldErrors: { "match.title.de": ["invalid"] } });
  });

  it("parses contact details", () => {
    const result = parseSectionForm("contact", form({ whatsapp: "+49 30 1234567", email: "", address: "Str. 1\n10115 Berlin" }));
    expect(result).toEqual({ success: true, data: { whatsapp: "+49 30 1234567", email: "", address: "Str. 1\n10115 Berlin" } });
  });

  it("parses a legal body", () => {
    expect(parseSectionForm("legal.privacy", form({ "body.de": "## A", "body.en": "" }))).toEqual({ success: true, data: { body: { de: "## A", en: "" } } });
  });
});
