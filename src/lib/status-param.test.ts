import { describe, expect, it } from "vitest";
import { pickStatus } from "./status-param";

const STATUSES = ["new", "read", "archived"] as const;

describe("pickStatus", () => {
  it("returns an allowed status", () => expect(pickStatus("read", STATUSES)).toBe("read"));
  it("ignores unknown values", () => expect(pickStatus("foo", STATUSES)).toBeUndefined());
  it("ignores a missing value", () => expect(pickStatus(undefined, STATUSES)).toBeUndefined());
  it("ignores repeated parameters", () => expect(pickStatus(["new", "read"], STATUSES)).toBeUndefined());
  it("is case-sensitive", () => expect(pickStatus("NEW", STATUSES)).toBeUndefined());
});
