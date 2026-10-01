import { describe, expect, it } from "vitest";
import { adminLoginPath, isProtectedAdminPath, safeNextPath } from "./paths";

describe("isProtectedAdminPath", () => {
  it.each([
    ["/en/admin", true],
    ["/de/admin/applications/1", true],
    ["/en/admin/login", false],
    ["/en/administrator", false],
    ["/en/apply/pflege", false],
  ])("%s → %s", (path, expected) => expect(isProtectedAdminPath(path)).toBe(expected));
});

describe("adminLoginPath", () => {
  it("keeps the locale", () => expect(adminLoginPath("/de/admin/applications")).toBe("/de/admin/login"));
});

describe("safeNextPath", () => {
  it.each(["/de/admin/set-password", "/en/admin", "/en/admin/applications"])("keeps %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    null,
    "",
    "https://evil.example/de/admin",
    "//evil.example/de/admin",
    "/\\evil.example",
    "/de/admin/../../evil",
    "/fr/admin",
    "/de/blog",
  ])("falls back for %j", (path) => {
    expect(safeNextPath(path)).toBe("/de/admin");
  });
});
