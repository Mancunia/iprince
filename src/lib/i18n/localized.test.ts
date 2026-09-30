import { describe, expect, it } from "vitest";
import { localized, localizedText } from "./localized";

describe("localized", () => {
  it("returns the requested locale", () => expect(localized({ de: "Pflege", en: "Nursing" }, "en")).toBe("Nursing"));
  it("falls back to German when English is blank", () => expect(localized({ de: "Pflege", en: "  " }, "en")).toBe("Pflege"));
  it("handles null", () => expect(localized(null, "de")).toBe(""));
});

describe("localizedText", () => {
  it("requires German", () => expect(localizedText.safeParse({ de: " ", en: "x" }).success).toBe(false));
  it("defaults English to empty", () => expect(localizedText.parse({ de: "Pflege" })).toEqual({ de: "Pflege", en: "" }));
});
