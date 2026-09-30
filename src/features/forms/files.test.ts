import { describe, expect, it } from "vitest";
import { formDefinition } from "./definition";
import { buildStoragePath, mimeMatches, validateFiles } from "./files";

const label = { de: "x", en: "x" };
const def = formDefinition.parse({
  fields: [
    { key: "cv", type: "file", required: true, accept: ["application/pdf"], maxSizeMb: 1, label },
    { key: "photos", type: "file", accept: ["image/*"], label },
  ],
});
const MB = 1024 * 1024;

describe("validateFiles", () => {
  it("accepts a valid set", () => {
    expect(validateFiles(def, [{ fieldKey: "cv", name: "cv.pdf", type: "application/pdf", size: MB }])).toEqual({});
  });
  it("flags a missing required file", () => expect(validateFiles(def, [])).toEqual({ cv: ["required"] }));
  it("flags size, type, count and unknown fields", () => {
    const errors = validateFiles(def, [
      { fieldKey: "cv", name: "a.pdf", type: "application/pdf", size: MB + 1 },
      { fieldKey: "cv", name: "b.exe", type: "application/x-msdownload", size: 10 },
      { fieldKey: "evil", name: "x", type: "text/plain", size: 1 },
    ]);
    expect(errors.cv).toEqual(expect.arrayContaining(["too_many", "too_large", "type_not_allowed"]));
    expect(errors.evil).toEqual(["unknown_field"]);
  });
  it("flags empty files", () =>
    expect(validateFiles(def, [{ fieldKey: "cv", name: "a.pdf", type: "application/pdf", size: 0 }])).toEqual({ cv: ["too_large"] }));
});

describe("mimeMatches", () => {
  it("handles wildcards", () => {
    expect(mimeMatches("image/*", "image/png")).toBe(true);
    expect(mimeMatches("image/*", "application/pdf")).toBe(false);
    expect(mimeMatches("application/pdf", "application/pdf")).toBe(true);
  });
});

describe("buildStoragePath", () => {
  it("scopes to the application and sanitises the name", () => {
    expect(buildStoragePath("app-1", "cv", "Lebenslauf Müller (final).pdf", "n1")).toBe("app-1/cv/n1-Lebenslauf_Mu_ller_final_.pdf");
  });
  it("strips path traversal", () => {
    expect(buildStoragePath("app-1", "cv", "../../etc/passwd", "n1")).toBe("app-1/cv/n1-____etc_passwd");
  });
});
