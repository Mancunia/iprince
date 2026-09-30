import { describe, expect, it } from "vitest";
import { formDefinition } from "./definition";
import { formDataToAnswers, validateAnswers } from "./answers";

const label = { de: "x", en: "x" };
const def = formDefinition.parse({
  fields: [
    { key: "level", type: "language_level", required: true, label },
    { key: "years", type: "number", required: true, label },
    { key: "area", type: "select", required: true, label, options: [{ value: "icu", label }, { value: "gen", label }] },
    { key: "skills", type: "multiselect", label, options: [{ value: "a", label }, { value: "b", label }] },
    { key: "consent", type: "checkbox", required: true, label },
    { key: "started", type: "checkbox", label },
    { key: "note", type: "textarea", label },
    { key: "since", type: "date", label },
    { key: "cv", type: "file", required: true, label },
  ],
});

describe("formDataToAnswers", () => {
  it("coerces types, trims text and omits blanks and files", () => {
    const fd = new FormData();
    fd.set("answers.level", "B2");
    fd.set("answers.years", " 4 ");
    fd.set("answers.area", "icu");
    fd.append("answers.skills", "a");
    fd.append("answers.skills", "b");
    fd.set("answers.consent", "on");
    fd.set("answers.note", "   ");
    fd.set("answers.cv", new Blob(["x"]));
    expect(formDataToAnswers(def, fd)).toEqual({ level: "B2", years: 4, area: "icu", skills: ["a", "b"], consent: true, started: false });
  });
});

describe("validateAnswers", () => {
  const valid = { level: "B2", years: 4, area: "icu", consent: true };

  it("accepts valid answers and fills defaults", () => {
    const r = validateAnswers(def, valid);
    expect(r).toEqual({ ok: true, data: { ...valid, skills: [], started: false } });
  });

  it("reports missing required fields as required", () => {
    const r = validateAnswers(def, { consent: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors).toMatchObject({ level: ["required"], years: ["required"], area: ["required"] });
  });

  it("reports an unchecked required checkbox as required", () => {
    const r = validateAnswers(def, { ...valid, consent: false });
    expect(!r.ok && r.fieldErrors.consent).toEqual(["required"]);
  });

  it("reports bad values as invalid", () => {
    const r = validateAnswers(def, { ...valid, years: Number("abc"), area: "nope", since: "31.12.2020" });
    expect(!r.ok && r.fieldErrors).toMatchObject({ years: ["invalid"], area: ["invalid"], since: ["invalid"] });
  });

  it("rejects unknown keys", () => {
    const r = validateAnswers(def, { ...valid, hacker: "x" });
    expect(r.ok).toBe(false);
  });

  it("reports blank required text as required, not invalid", () => {
    const d = formDefinition.parse({ fields: [{ key: "t", type: "text", required: true, label }] });
    for (const t of ["", "   ", null]) {
      const r = validateAnswers(d, { t });
      expect(!r.ok && r.fieldErrors).toEqual({ t: ["required"] });
    }
  });

  it("does not read inherited properties as answers", () => {
    const d = formDefinition.parse({ fields: [{ key: "t", type: "text", required: true, label }] });
    const r = validateAnswers(d, Object.create({ t: "inherited" }));
    expect(r.ok).toBe(false);
  });

  it("returns a plain-object fieldErrors map", () => {
    const r = validateAnswers(def, { consent: true, ["__proto__"]: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.getPrototypeOf(r.fieldErrors)).toBe(Object.prototype);
    const parsed = validateAnswers(def, JSON.parse('{"__proto__":1}'));
    if (!parsed.ok) {
      expect(Object.getPrototypeOf(parsed.fieldErrors)).toBe(Object.prototype);
      expect(Object.hasOwn(parsed.fieldErrors, "__proto__")).toBe(true);
    }
  });
});
