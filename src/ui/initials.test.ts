import { describe, expect, it } from "vitest";
import { initials } from "./initials";

describe("initials", () => {
  it("takes the first letters of the first and last word", () => {
    expect(initials("Erika Muster")).toBe("EM");
    expect(initials("Anna Maria Schmidt")).toBe("AS");
  });
  it("uses one letter for a single word", () => expect(initials("madonna")).toBe("M"));
  it("handles accents and extra whitespace", () => expect(initials("  łukasz   żak ")).toBe("ŁŻ"));
  it("keeps emoji whole", () => expect(initials("😀 Smile")).toBe("😀S"));
  it("falls back to a question mark for an empty name", () => expect(initials("   ")).toBe("?"));
});
