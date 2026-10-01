import { describe, expect, it } from "vitest";
import { fail, fieldErrorsOf, ok } from "./result";

describe("result", () => {
  it("wraps data", () => expect(ok(1)).toEqual({ ok: true, data: 1 }));
  it("wraps errors", () =>
    expect(fail("rate_limited", { email: ["invalid"] })).toEqual({ ok: false, formError: "rate_limited", fieldErrors: { email: ["invalid"] } }));
});

describe("fieldErrorsOf", () => {
  it("maps each issue's first path segment to an invalid code", () => {
    expect(fieldErrorsOf([{ path: ["slug"] }, { path: ["nameDe", 0] }, { path: ["slug"] }])).toEqual({
      slug: ["invalid"],
      nameDe: ["invalid"],
    });
  });
});
