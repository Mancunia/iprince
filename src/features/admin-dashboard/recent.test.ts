import { describe, expect, it } from "vitest";
import { mergeRecent } from "./recent";

const lead = (id: string, createdAt: string) => ({ id, company: `Company ${id}`, status: "new" as const, createdAt });
const message = (id: string, createdAt: string) => ({ id, name: `Sender ${id}`, status: "read" as const, createdAt });

describe("mergeRecent", () => {
  it("interleaves enquiries and messages, newest first", () => {
    const items = mergeRecent(
      [lead("l1", "2026-10-01T10:00:00Z"), lead("l2", "2026-09-30T10:00:00Z")],
      [message("m1", "2026-10-01T12:00:00Z")],
      5,
    );
    expect(items.map((i) => i.id)).toEqual(["m1", "l1", "l2"]);
    expect(items[0]).toEqual({ kind: "message", id: "m1", title: "Sender m1", status: "read", createdAt: "2026-10-01T12:00:00Z" });
    expect(items[1]).toMatchObject({ kind: "lead", title: "Company l1", status: "new" });
  });

  it("keeps at most `limit` items", () => {
    const leads = ["1", "2", "3"].map((d) => lead(d, `2026-10-0${d}T00:00:00Z`));
    expect(mergeRecent(leads, [], 2).map((i) => i.id)).toEqual(["3", "2"]);
  });

  it("compares instants, not strings with different offsets", () => {
    const items = mergeRecent([lead("l", "2026-10-01T10:00:00+02:00")], [message("m", "2026-10-01T09:00:00+00:00")], 5);
    expect(items.map((i) => i.id)).toEqual(["m", "l"]);
  });

  it("returns an empty list when there is nothing", () => expect(mergeRecent([], [], 5)).toEqual([]));
});
