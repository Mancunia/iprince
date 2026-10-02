import { describe, expect, it } from "vitest";
import { readingMinutes } from "./reading-time";

describe("readingMinutes", () => {
  it("is at least one minute", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("## - ** --- > |")).toBe(1);
  });

  it("counts 200 words per minute, rounding up", () => {
    expect(readingMinutes("wort ".repeat(200))).toBe(1);
    expect(readingMinutes("wort ".repeat(201))).toBe(2);
  });

  it("does not count markdown symbols as words", () => {
    expect(readingMinutes("- **wort** ".repeat(400))).toBe(2);
  });
});
