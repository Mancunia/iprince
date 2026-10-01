import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PHOTO_SLOTS, PHOTOS } from "./photos";

describe("PHOTOS", () => {
  it("configures every slot", () => expect(Object.keys(PHOTOS).sort()).toEqual([...PHOTO_SLOTS].sort()));

  it.each(PHOTO_SLOTS)("%s is a placeholder or an existing file under public/photos", (slot) => {
    const src = PHOTOS[slot];
    if (src === null) return;
    expect(src).toMatch(/^\/photos\/[\w.-]+\.(jpe?g|png|webp|avif)$/);
    expect(existsSync(path.join(process.cwd(), "public", src))).toBe(true);
  });
});
