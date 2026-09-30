import { describe, expect, it } from "vitest";
import { fail, ok } from "./result";

describe("result", () => {
  it("wraps data", () => expect(ok(1)).toEqual({ ok: true, data: 1 }));
  it("wraps errors", () =>
    expect(fail("rate_limited", { email: ["invalid"] })).toEqual({ ok: false, formError: "rate_limited", fieldErrors: { email: ["invalid"] } }));
});
