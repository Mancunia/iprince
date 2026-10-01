import { describe, expect, it } from "vitest";
import de from "./messages/de.json";
import en from "./messages/en.json";

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("messages", () => {
  it("German and English define the same keys", () => {
    expect(keys(de).sort()).toEqual(keys(en).sort());
  });
});
