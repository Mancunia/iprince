import { describe, expect, it } from "vitest";
import {
  changeType, errorsUnder, hasErrorsUnder, moveItem, newField, nextOptionValue, parseAccept, removeAt,
  selectedAfterMove, selectedAfterRemove, suggestKey, validateDefinition,
} from "./model";

const KEY_RULE = /^[a-z][a-z0-9_]{0,39}$/;

describe("moveItem / removeAt", () => {
  it("swaps neighbours", () => {
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
  });
  it("ignores moves past either end", () => {
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });
  it("removes by index", () => {
    expect(removeAt(["a", "b", "c"], 1)).toEqual(["a", "c"]);
  });
});

describe("selection follows edits", () => {
  it("follows the moved item and its swapped neighbour", () => {
    expect(selectedAfterMove(1, 1, 1)).toBe(2);
    expect(selectedAfterMove(2, 1, 1)).toBe(1);
    expect(selectedAfterMove(0, 1, 1)).toBe(0);
    expect(selectedAfterMove(null, 1, 1)).toBeNull();
  });
  it("clears or shifts after a removal", () => {
    expect(selectedAfterRemove(1, 1)).toBeNull();
    expect(selectedAfterRemove(3, 1)).toBe(2);
    expect(selectedAfterRemove(0, 1)).toBe(0);
  });
});

describe("suggestKey", () => {
  it.each([
    ["Größe in cm", [], "groesse_in_cm"],
    ["Führerschein Klasse B", [], "fuehrerschein_klasse_b"],
    ["Café-Erfahrung", [], "cafe_erfahrung"],
    ["2. Sprache", [], "f_2_sprache"],
    ["", [], "field"],
    ["!!!", [], "field"],
    ["Email", [], "email_2"],
    ["Name", ["name", "name_2"], "name_3"],
    ["", ["field"], "field_2"],
  ])("%j with %j → %s", (label, existing, expected) => {
    expect(suggestKey(label, existing)).toBe(expected);
  });

  it("always satisfies the key rule, even for long labels", () => {
    const key = suggestKey("Sehr lange Beschreibung der bisherigen Berufserfahrung im Ausland", []);
    expect(key).toMatch(KEY_RULE);
    expect(suggestKey("x".repeat(80), ["x".repeat(36)])).toMatch(KEY_RULE);
  });
});

describe("newField / changeType", () => {
  it("creates an unlabeled field with a free key", () => {
    expect(newField("text", ["field"])).toEqual({ key: "field_2", type: "text", label: { de: "", en: "" }, required: false });
  });
  it("adds one option to choice fields and defaults to files", () => {
    expect(newField("radio", []).options).toEqual([{ value: "option_1", label: { de: "", en: "" } }]);
    expect(newField("file", [])).toMatchObject({ accept: ["application/pdf"], maxSizeMb: 10 });
  });
  it("drops settings that no longer apply and keeps ones that do", () => {
    const select = { ...newField("select", []), options: [{ value: "a", label: { de: "A", en: "" } }] };
    expect(changeType(select, "text")).not.toHaveProperty("options");
    expect(changeType(select, "radio").options).toEqual(select.options);
    expect(changeType(newField("file", []), "date")).not.toHaveProperty("accept");
  });
});

describe("options and accept", () => {
  it("finds the first unused option value", () => {
    expect(nextOptionValue([{ value: "option_1" }, { value: "option_3" }])).toBe("option_2");
  });
  it("parses comma-separated MIME types", () => {
    expect(parseAccept(" application/pdf, image/* ,")).toEqual(["application/pdf", "image/*"]);
    expect(parseAccept("  ")).toBeUndefined();
  });
});

describe("validation errors", () => {
  const field = (key: string) => ({ key, type: "text", label: { de: "L", en: "" }, required: false });

  it("accepts a valid definition", () => {
    expect(validateDefinition({ fields: [field("a")] })).toMatchObject({ ok: true });
  });

  it("keys errors by dotted path", () => {
    const result = validateDefinition({ fields: [field("a"), { ...field("a"), label: { de: "", en: "" } }] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["fields.1.key", "fields.1.label.de"]);
    expect(errorsUnder(result.errors, "fields.1")).toEqual({ key: expect.any(Array), "label.de": expect.any(Array) });
    expect(hasErrorsUnder(result.errors, "fields.1")).toBe(true);
    expect(hasErrorsUnder(result.errors, "fields.0")).toBe(false);
  });

  it("does not confuse fields.1 with fields.10", () => {
    expect(errorsUnder({ "fields.10.key": ["x"] }, "fields.1")).toEqual({});
  });
});
