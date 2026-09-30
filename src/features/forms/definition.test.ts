import { describe, expect, it } from "vitest";
import { formDefinition } from "./definition";

const label = { de: "Feld", en: "Field" };

describe("formDefinition", () => {
  it("accepts a valid definition and defaults required to false", () => {
    const def = formDefinition.parse({ fields: [{ key: "notes", type: "textarea", label }] });
    expect(def.fields[0].required).toBe(false);
  });

  it("rejects duplicate keys", () => {
    const r = formDefinition.safeParse({ fields: [{ key: "a", type: "text", label }, { key: "a", type: "text", label }] });
    expect(r.success).toBe(false);
  });

  it("rejects reserved keys used by the fixed fields", () => {
    expect(formDefinition.safeParse({ fields: [{ key: "email", type: "text", label }] }).success).toBe(false);
  });

  it("requires options for choice fields", () => {
    expect(formDefinition.safeParse({ fields: [{ key: "a", type: "select", label }] }).success).toBe(false);
  });

  it("rejects a field in an unknown section", () => {
    expect(formDefinition.safeParse({ fields: [{ key: "a", type: "text", label, section: "nope" }] }).success).toBe(false);
  });

  it("caps file size at the bucket limit", () => {
    expect(formDefinition.safeParse({ fields: [{ key: "cv", type: "file", label, maxSizeMb: 50 }] }).success).toBe(false);
  });
});
