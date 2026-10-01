import { describe, expect, it } from "vitest";
import { canRemove, inviteInput, inviteInsertFailure, inviteRedirectUrl, memberStatus } from "./team";

describe("inviteInput", () => {
  it("normalises a valid invite", () => {
    expect(inviteInput.parse({ email: " Anna@Example.com ", displayName: "  Anna " })).toEqual({ email: "anna@example.com", displayName: "Anna" });
  });
  it.each([
    [{ email: "nope", displayName: "A" }, "email"],
    [{ email: "a@b.de", displayName: "  " }, "displayName"],
  ])("rejects %j", (input, path) => {
    expect(inviteInput.safeParse(input).error?.issues[0].path[0]).toBe(path);
  });
});

describe("inviteRedirectUrl", () => {
  it("points at the confirm route with the set-password page as next", () => {
    expect(inviteRedirectUrl("http://localhost:3000", "de")).toBe(
      "http://localhost:3000/api/auth/confirm?next=%2Fde%2Fadmin%2Fset-password",
    );
  });
});

describe("canRemove", () => {
  it("allows removing editors other than yourself", () => {
    expect(canRemove({ userId: "e", role: "editor" }, "o")).toBe(true);
  });
  it("never removes an owner or yourself", () => {
    expect(canRemove({ userId: "o2", role: "owner" }, "o")).toBe(false);
    expect(canRemove({ userId: "o", role: "editor" }, "o")).toBe(false);
  });
});

describe("memberStatus", () => {
  it("is pending until the first sign-in", () => {
    expect(memberStatus(null)).toBe("pending");
    expect(memberStatus(undefined)).toBe("pending");
    expect(memberStatus("2026-10-01T10:00:00Z")).toBe("active");
  });
});

describe("inviteInsertFailure", () => {
  it("treats a unique violation as an existing member and never rolls back", () => {
    expect(inviteInsertFailure("23505")).toBe("exists");
  });
  it("rolls back for any other insert error", () => {
    expect(inviteInsertFailure("42501")).toBe("rollback");
    expect(inviteInsertFailure(undefined)).toBe("rollback");
  });
});
