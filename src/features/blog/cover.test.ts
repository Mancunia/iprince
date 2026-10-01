import { describe, expect, it } from "vitest";
import { coverFolder, isCoverPathFor } from "./cover";

const POST = "14000000-0000-4000-8000-0000000000a1";
const OTHER = "14000000-0000-4000-8000-0000000000a2";
const FILE = "0b6f7c1e-2f3a-4c5d-8e9f-a0b1c2d3e4f5";

describe("isCoverPathFor", () => {
  it("accepts the post's own uploaded file", () => {
    for (const ext of ["jpg", "png", "webp"]) expect(isCoverPathFor(POST, `posts/${POST}/${FILE}.${ext}`)).toBe(true);
  });

  it.each([
    [`posts/${OTHER}/${FILE}.jpg`, "another post's folder"],
    [`posts/${POST}/../${OTHER}/${FILE}.jpg`, "a traversal"],
    [`posts/${POST}/${FILE}.gif`, "a wrong extension"],
    [`posts/${POST}/cover.jpg`, "a non-uuid file name"],
    [`${POST}/${FILE}.jpg`, "a missing posts/ prefix"],
  ])("rejects %s (%s)", (path) => {
    expect(isCoverPathFor(POST, path)).toBe(false);
  });

  it("rejects a post id that is not a uuid", () => {
    expect(isCoverPathFor(".*", `posts/.*/${FILE}.jpg`)).toBe(false);
  });
});

describe("coverFolder", () => {
  it("is posts/<id>", () => expect(coverFolder(POST)).toBe(`posts/${POST}`));
});
