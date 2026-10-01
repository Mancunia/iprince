import { describe, expect, it } from "vitest";
import { checkNewPassword } from "./password";

describe("checkNewPassword", () => {
  it("accepts 12+ matching characters", () => {
    expect(checkNewPassword("twelve-chars", "twelve-chars")).toBeNull();
  });
  it("rejects short passwords", () => {
    expect(checkNewPassword("short", "short")).toEqual({ password: ["too_short"] });
  });
  it("rejects a mismatched confirmation", () => {
    expect(checkNewPassword("twelve-chars", "twelve-charz")).toEqual({ confirm: ["mismatch"] });
  });
  it("rejects absurdly long input", () => {
    expect(checkNewPassword("x".repeat(201), "x".repeat(201))).toEqual({ password: ["invalid"] });
  });
});
