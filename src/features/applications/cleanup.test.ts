import { describe, expect, it, vi } from "vitest";
import type { ServiceClient } from "@/lib/supabase/service";
import { ABANDONED_AFTER_MS, cleanupAbandoned } from "./cleanup";

type Options = { listOrphans: () => string[]; removable?: (names: string[]) => string[]; deleted?: number };

function fakeClient({ listOrphans, removable = (names) => names, deleted = 0 }: Options) {
  const rpc = vi.fn(async (fn: string) => {
    if (fn === "orphaned_application_objects") return { data: listOrphans(), error: null };
    if (fn === "delete_abandoned_applications") return { data: deleted, error: null };
    throw new Error(`unexpected rpc ${fn}`);
  });
  const remove = vi.fn(async (names: string[]) => ({ data: removable(names).map((name) => ({ name })), error: null }));
  const client = { rpc, storage: { from: () => ({ remove }) } } as unknown as ServiceClient;
  return { client, rpc, remove };
}

describe("cleanupAbandoned", () => {
  const now = new Date("2026-10-01T03:00:00Z");

  it("removes orphan batches until none are left, then deletes abandoned rows", async () => {
    const pages = [["a", "b"], ["c"], []];
    const { client, rpc, remove } = fakeClient({ listOrphans: () => pages.shift() ?? [], deleted: 2 });

    const result = await cleanupAbandoned(client, now);

    expect(result).toEqual({ filesDeleted: 3, applicationsDeleted: 2, complete: true });
    expect(remove).toHaveBeenCalledTimes(2);
    const cutoff = new Date(now.getTime() - ABANDONED_AFTER_MS).toISOString();
    expect(rpc).toHaveBeenCalledWith("orphaned_application_objects", { p_cutoff: cutoff, p_limit: 500 });
    expect(rpc).toHaveBeenLastCalledWith("delete_abandoned_applications", { p_cutoff: cutoff });
  });

  it("stops when a batch removes nothing instead of looping", async () => {
    const { client, remove } = fakeClient({ listOrphans: () => ["stuck"], removable: () => [] });

    const result = await cleanupAbandoned(client, now);

    expect(remove).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ filesDeleted: 0, applicationsDeleted: 0, complete: false });
  });

  it("stops listing when the time budget is spent but still deletes rows", async () => {
    const { client, remove } = fakeClient({ listOrphans: () => ["x"], deleted: 1 });

    const result = await cleanupAbandoned(client, now, 0);

    expect(remove).not.toHaveBeenCalled();
    expect(result).toEqual({ filesDeleted: 0, applicationsDeleted: 1, complete: false });
  });

  it("throws when the database call fails", async () => {
    const client = {
      rpc: async () => ({ data: null, error: { message: "boom" } }),
      storage: { from: () => ({ remove: async () => ({ data: [], error: null }) }) },
    } as unknown as ServiceClient;
    await expect(cleanupAbandoned(client, now)).rejects.toMatchObject({ message: "boom" });
  });
});
