import { describe, expect, it } from "vitest";
import { berlinInputToUtc, postState, resolvePublishedAt, utcToBerlinInput } from "./publish";

const NOW = new Date("2026-10-01T12:00:00.000Z");

describe("postState", () => {
  it("is draft for drafts, whatever the date", () => {
    expect(postState("draft", null, NOW)).toBe("draft");
    expect(postState("draft", "2026-01-01T00:00:00.000Z", NOW)).toBe("draft");
  });

  it("is scheduled for a published post with a future date", () => {
    expect(postState("published", "2026-10-01T12:00:01.000Z", NOW)).toBe("scheduled");
  });

  it("is live from the publish instant on", () => {
    expect(postState("published", "2026-10-01T12:00:00.000Z", NOW)).toBe("live");
    expect(postState("published", "2026-09-01T00:00:00+00:00", NOW)).toBe("live");
  });
});

describe("berlinInputToUtc", () => {
  it.each([
    ["2026-01-15T12:00", "2026-01-15T11:00:00.000Z"], // winter, UTC+1
    ["2026-07-01T12:00", "2026-07-01T10:00:00.000Z"], // summer, UTC+2
    ["2026-03-29T01:30", "2026-03-29T00:30:00.000Z"], // just before the spring change
    ["2026-03-29T03:30", "2026-03-29T01:30:00.000Z"], // just after it
    ["2026-10-25T03:30", "2026-10-25T02:30:00.000Z"], // after the autumn change
  ])("%s → %s", (input, utc) => {
    expect(berlinInputToUtc(input)).toBe(utc);
  });

  it.each(["", "soon", "2026-02-30T10:00", "2026-07-01 12:00", "2026-07-01T24:00", "2026-07-01T12:60"])("rejects %j", (input) => {
    expect(berlinInputToUtc(input)).toBeNull();
  });
});

describe("utcToBerlinInput", () => {
  it("shows Berlin wall time, also for Postgres timestamptz strings", () => {
    expect(utcToBerlinInput("2026-01-15T11:00:00.000Z")).toBe("2026-01-15T12:00");
    expect(utcToBerlinInput("2026-07-01T10:00:00+00:00")).toBe("2026-07-01T12:00");
  });

  it("is empty without a usable date", () => {
    expect(utcToBerlinInput(null)).toBe("");
    expect(utcToBerlinInput("not a date")).toBe("");
  });

  it("round-trips, so re-saving a post keeps its date", () => {
    for (const value of ["2026-03-29T03:30", "2026-12-31T23:59", "2026-06-15T00:00"]) {
      expect(utcToBerlinInput(berlinInputToUtc(value))).toBe(value);
    }
  });
});

describe("resolvePublishedAt", () => {
  it("uses the entered date", () => {
    expect(resolvePublishedAt("published", "2026-07-01T12:00", NOW)).toBe("2026-07-01T10:00:00.000Z");
  });

  it("defaults to now when publishing without a date", () => {
    expect(resolvePublishedAt("published", "", NOW)).toBe(NOW.toISOString());
  });

  it("leaves a draft without a date undated", () => {
    expect(resolvePublishedAt("draft", "", NOW)).toBeNull();
  });

  it("keeps a date on a draft (a prepared schedule)", () => {
    expect(resolvePublishedAt("draft", "2026-07-01T12:00", NOW)).toBe("2026-07-01T10:00:00.000Z");
  });
});
