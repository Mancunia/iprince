import { describe, expect, it } from "vitest";
import { adminLoginPath, isProtectedAdminPath } from "./paths";

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
