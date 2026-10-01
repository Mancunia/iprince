import type { ServiceClient } from "@/lib/supabase/service";

export const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 500;
const BUCKET = "applications";

export type CleanupResult = { filesDeleted: number; applicationsDeleted: number; complete: boolean };

/**
 * Deletes uploads no submitted application references, then applications never submitted, both older than 24 h.
 * Every step is idempotent: a failed or partial run is finished by the next one.
 */
export async function cleanupAbandoned(supabase: ServiceClient, now: Date, budgetMs = 50_000): Promise<CleanupResult> {
  const started = Date.now();
  const cutoff = new Date(now.getTime() - ABANDONED_AFTER_MS).toISOString();
  let filesDeleted = 0;
  let complete = false;

  while (Date.now() - started < budgetMs) {
    const { data: names, error } = await supabase.rpc("orphaned_application_objects", { p_cutoff: cutoff, p_limit: BATCH_SIZE });
    if (error) throw error;
    if (names.length === 0) {
      complete = true;
      break;
    }
    const { data: removed, error: removeError } = await supabase.storage.from(BUCKET).remove(names);
    if (removeError) throw removeError;
    filesDeleted += removed.length;
    if (removed.length === 0) break; // Storage refused every name; the next run retries.
  }

  const { data: applicationsDeleted, error } = await supabase.rpc("delete_abandoned_applications", { p_cutoff: cutoff });
  if (error) throw error;
  return { filesDeleted, applicationsDeleted, complete };
}
