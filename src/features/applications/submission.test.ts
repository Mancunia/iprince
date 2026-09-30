import { describe, expect, it } from "vitest";
import { fileMetaFromStorage, isOwnedPath, isSubmittableForm, submissionInput } from "./submission";

const id = "a0000000-0000-4000-8000-000000000001";

describe("isSubmittableForm", () => {
  it("accepts any published version of the same profession", () =>
    expect(isSubmittableForm({ professionId: "p1", publishedAt: "2026-01-01T00:00:00Z" }, "p1")).toBe(true));
  it("rejects a form belonging to another profession", () =>
    expect(isSubmittableForm({ professionId: "p2", publishedAt: "2026-01-01T00:00:00Z" }, "p1")).toBe(false));
  it("rejects an unpublished draft", () => expect(isSubmittableForm({ professionId: "p1", publishedAt: null }, "p1")).toBe(false));
});

describe("isOwnedPath", () => {
  it("accepts paths under the application prefix", () => expect(isOwnedPath(id, `${id}/cv/n-cv.pdf`)).toBe(true));
  it("rejects other applications' paths", () =>
    expect(isOwnedPath(id, "b0000000-0000-4000-8000-000000000001/cv/n-cv.pdf")).toBe(false));
  it("rejects traversal", () => expect(isOwnedPath(id, `${id}/../other/cv.pdf`)).toBe(false));
  it("rejects paths without a field segment", () => expect(isOwnedPath(id, `${id}/cv.pdf`)).toBe(false));
});

describe("fileMetaFromStorage", () => {
  it("uses real size and MIME from storage", () =>
    expect(fileMetaFromStorage(`${id}/cv/n-cv.pdf`, { size: 1234, mimetype: "application/pdf" })).toEqual({
      fieldKey: "cv", name: "n-cv.pdf", type: "application/pdf", size: 1234,
    }));
  it("returns null when the object is missing or malformed", () => {
    expect(fileMetaFromStorage(`${id}/cv/x`, null)).toBeNull();
    expect(fileMetaFromStorage(`${id}/cv/x`, { size: "big" })).toBeNull();
  });
});

describe("submissionInput", () => {
  const base = {
    professionSlug: "pflege", formId: id, locale: "en", fullName: "  Ada Lovelace ", email: "ada@example.com",
    phone: "", hp_field: "", answers: {}, files: [],
  };
  it("trims and normalises optional phone", () => {
    const parsed = submissionInput.parse(base);
    expect(parsed.fullName).toBe("Ada Lovelace");
    expect(parsed.phone).toBeUndefined();
  });
  it("keeps the honeypot value under hp_field", () =>
    expect(submissionInput.parse({ ...base, hp_field: "bot" }).hp_field).toBe("bot"));
  it("rejects a bad email", () => expect(submissionInput.safeParse({ ...base, email: "nope" }).success).toBe(false));
  it("caps the number of files", () =>
    expect(submissionInput.safeParse({ ...base, files: Array.from({ length: 11 }, () => ({ fieldKey: "cv", name: "a", type: "x", size: 1 })) }).success).toBe(false));
});
