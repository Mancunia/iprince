import { describe, expect, it } from "vitest";
import { formDefinition } from "@/features/forms/definition";
import { APPLICATION_STATUSES, describeAnswers } from "./review";

const def = formDefinition.parse({
  fields: [
    { key: "area", type: "select", label: { de: "Bereich", en: "Area" }, options: [{ value: "icu", label: { de: "Intensiv", en: "Intensive care" } }] },
    { key: "skills", type: "multiselect", label: { de: "Kenntnisse", en: "" }, options: [{ value: "a", label: { de: "A-de", en: "A" } }, { value: "b", label: { de: "B-de", en: "B" } }] },
    { key: "started", type: "checkbox", label: { de: "Begonnen", en: "Started" } },
    { key: "years", type: "number", label: { de: "Jahre", en: "Years" } },
    { key: "note", type: "textarea", label: { de: "Notiz", en: "Note" } },
    { key: "cv", type: "file", label: { de: "CV", en: "CV" } },
  ],
});

describe("describeAnswers", () => {
  it("uses labels from the form version, falls back to German, skips files and blanks", () => {
    const rows = describeAnswers(def, { area: "icu", skills: ["a", "b"], started: true, years: 4 }, "en", { yes: "Yes", no: "No" });
    expect(rows).toEqual([
      { key: "area", label: "Area", value: "Intensive care" },
      { key: "skills", label: "Kenntnisse", value: "A, B" },
      { key: "started", label: "Started", value: "Yes" },
      { key: "years", label: "Years", value: "4" },
    ]);
  });

  it("shows raw values for options that no longer exist", () => {
    expect(describeAnswers(def, { area: "gone" }, "en", { yes: "Yes", no: "No" })[0].value).toBe("gone");
  });
});

it("statuses match the DB enum", () => {
  expect(APPLICATION_STATUSES).toEqual(["new", "reviewing", "contacted", "placed", "rejected", "archived"]);
});
