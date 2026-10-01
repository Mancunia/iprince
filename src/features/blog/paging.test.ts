import { describe, expect, it } from "vitest";
import { pageCount, pageRange, parsePage } from "./paging";

describe("parsePage", () => {
  it("defaults to page 1", () => expect(parsePage(undefined)).toBe(1));
  it("reads positive integers", () => expect(parsePage("3")).toBe(3));
  it.each(["0", "-1", "abc", "2.5", "", "01", "999999"])("rejects %j", (raw) => expect(parsePage(raw)).toBeNull());
  it("rejects a repeated parameter", () => expect(parsePage(["1", "2"])).toBeNull());
});

describe("pageCount", () => {
  it.each([[0, 1], [1, 1], [9, 1], [10, 2], [27, 3]])("%i posts → %i pages", (total, pages) => expect(pageCount(total)).toBe(pages));
});

describe("pageRange", () => {
  it("returns the inclusive row range of a page", () => {
    expect(pageRange(1)).toEqual({ from: 0, to: 8 });
    expect(pageRange(3)).toEqual({ from: 18, to: 26 });
  });
});
