import { describe, expect, it } from "vitest";
import { hasPlaceholder, legalProblems } from "./legal-check";

const body = (de: string, en = "") => ({ body: { de, en } });

describe("hasPlaceholder", () => {
  it("finds the marker", () => expect(hasPlaceholder("Firma [PLATZHALTER: Name]")).toBe(true));
  it("ignores clean text", () => expect(hasPlaceholder("Firma GmbH")).toBe(false));
});

describe("legalProblems", () => {
  it("passes clean rows", () => {
    expect(legalProblems([{ key: "legal.imprint", value: body("A") }, { key: "legal.privacy", value: body("B", "C") }])).toEqual([]);
  });
  it("reports missing rows", () => {
    expect(legalProblems([{ key: "legal.imprint", value: body("A") }])).toEqual(["legal.privacy: missing"]);
  });
  it("reports placeholders per language", () => {
    expect(legalProblems([
      { key: "legal.imprint", value: body("A", "[PLATZHALTER: x]") },
      { key: "legal.privacy", value: body("[PLATZHALTER: y]") },
    ])).toEqual(["legal.imprint: placeholder in en", "legal.privacy: placeholder in de"]);
  });
  it("reports an empty German body", () => {
    expect(legalProblems([{ key: "legal.imprint", value: body("") }, { key: "legal.privacy", value: body("B") }])).toEqual(["legal.imprint: missing"]);
  });
});
