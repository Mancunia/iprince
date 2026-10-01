import "server-only";
import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { CONTENT_KEYS, defaults, resolveContent, type ContentKey, type SiteContent } from "./content";

/** Every public page reads this. A failed read logs and renders the defaults instead of breaking the site. */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("site_content").select("key, value");
  if (error) {
    console.error("read site_content failed", error.code);
    return defaults;
  }
  return resolveContent(data, (key) => console.error("invalid site_content value", key));
});

/** When each stored key was last edited; keys without a row are absent (they show the default). */
export async function getContentMeta(): Promise<Partial<Record<ContentKey, string>>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("site_content").select("key, updated_at");
  if (error) {
    console.error("read site_content meta failed", error.code);
    return {};
  }
  const meta: Partial<Record<ContentKey, string>> = {};
  for (const row of data) if ((CONTENT_KEYS as readonly string[]).includes(row.key)) meta[row.key as ContentKey] = row.updated_at;
  return meta;
}
