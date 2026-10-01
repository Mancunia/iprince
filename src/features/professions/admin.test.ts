import { describe, expect, it } from "vitest";
import { canActivate, EMPTY_PROFESSION, formStatus, readProfessionForm, toProfessionRow } from "./admin";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const valid = { slug: "pflege-plus", nameDe: "Pflege", nameEn: "Nursing", summaryDe: "", summaryEn: "", icon: "briefcase", sortOrder: "3", openPositions: "12" };

describe("readProfessionForm", () => {
  it("parses a complete form; unticked checkboxes are false", () => {
    const parsed = readProfessionForm(form({ ...valid, isFeatured: "on" }));
    expect(parsed.success && parsed.data).toEqual({
      slug: "pflege-plus", nameDe: "Pflege", nameEn: "Nursing", summaryDe: "", summaryEn: "",
      icon: "briefcase", isActive: false, isFeatured: true, sortOrder: 3, openPositions: 12,
    });
  });

  it.each([
    ["slug", "Pflege Plus"],
    ["slug", "-pflege"],
    ["nameDe", "   "],
    ["icon", "../etc"],
    ["openPositions", "-1"],
    ["sortOrder", "1.5"],
  ])("rejects %s = %j", (key, value) => {
    const parsed = readProfessionForm(form({ ...valid, [key]: value }));
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0].path[0]).toBe(key);
  });

  it("treats empty numbers as 0", () => {
    const parsed = readProfessionForm(form({ ...valid, sortOrder: "", openPositions: "" }));
    expect(parsed.success && [parsed.data.sortOrder, parsed.data.openPositions]).toEqual([0, 0]);
  });
});

describe("toProfessionRow", () => {
  it("maps to database columns with jsonb translations", () => {
    expect(toProfessionRow({ ...EMPTY_PROFESSION, slug: "x", nameDe: "X", nameEn: "Ex" })).toEqual({
      slug: "x", name: { de: "X", en: "Ex" }, summary: { de: "", en: "" }, icon: "briefcase",
      is_active: false, is_featured: false, sort_order: 0, open_positions: 0,
    });
  });
});

describe("canActivate", () => {
  it("needs a current form only when activating", () => {
    expect(canActivate(true, null)).toBe(false);
    expect(canActivate(true, "f1")).toBe(true);
    expect(canActivate(false, null)).toBe(true);
  });
});

describe("formStatus", () => {
  const live = { id: "f1", version: 3, published_at: "2026-10-01T00:00:00Z" };
  const draft = { id: "f2", version: 4, published_at: null };

  it.each([
    [[], null, { kind: "none" }],
    [[draft], null, { kind: "draft_only" }],
    [[live], "f1", { kind: "live", version: 3, draft: false }],
    [[live, draft], "f1", { kind: "live", version: 3, draft: true }],
  ] as const)("forms %j with current %s", (forms, current, expected) => {
    expect(formStatus([...forms], current)).toEqual(expected);
  });
});
