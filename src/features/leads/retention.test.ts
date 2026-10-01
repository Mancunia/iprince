import { describe, expect, it } from "vitest";
import { monthsBefore, retentionCutoffs } from "./retention";

describe("monthsBefore", () => {
  it("goes back whole calendar months in UTC", () => {
    expect(monthsBefore(new Date("2026-03-15T03:00:00Z"), 12).toISOString()).toBe("2025-03-15T03:00:00.000Z");
  });

  it("crosses the year boundary", () => {
    expect(monthsBefore(new Date("2026-01-10T03:00:00Z"), 6).toISOString()).toBe("2025-07-10T03:00:00.000Z");
  });

  it("clamps to the last day of a shorter month", () => {
    expect(monthsBefore(new Date("2026-08-31T03:00:00Z"), 6).toISOString()).toBe("2026-02-28T03:00:00.000Z");
    expect(monthsBefore(new Date("2028-08-31T03:00:00Z"), 6).toISOString()).toBe("2028-02-29T03:00:00.000Z");
  });
});

describe("retentionCutoffs", () => {
  it("keeps messages 6 months and closed enquiries 12 months", () => {
    expect(retentionCutoffs(new Date("2026-10-01T03:00:00Z"))).toEqual({
      messages: "2026-04-01T03:00:00.000Z",
      leads: "2025-10-01T03:00:00.000Z",
    });
  });
});
