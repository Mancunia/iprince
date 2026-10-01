import { describe, expect, it } from "vitest";
import { hasConsent } from "./consent";

describe("hasConsent", () => {
  it("is true only for an accept that includes the category", () => {
    expect(hasConsent({ action: "accept", categories: ["strict", "functionality"] }, "functionality")).toBe(true);
  });
  it.each([
    ["no banner yet", undefined],
    ["no choice yet", {}],
    ["a reject", { action: "reject" as const, categories: ["strict" as const, "functionality" as const] }],
    ["another category", { action: "accept" as const, categories: ["strict" as const, "performance" as const] }],
  ])("is false for %s", (_, state) => {
    expect(hasConsent(state, "functionality")).toBe(false);
  });
});
