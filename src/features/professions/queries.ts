import "server-only";
import { localizedText, type LocalizedText } from "@/lib/i18n/localized";
import { createServerSupabase } from "@/lib/supabase/server";

export type ProfessionCard = { slug: string; name: LocalizedText; icon: string; openPositions: number };

/** Active professions visible to the public (RLS: is_active). */
export async function listActiveProfessions(): Promise<ProfessionCard[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("professions")
    .select("slug, name, icon, open_positions")
    .order("is_featured", { ascending: false })
    .order("sort_order");
  if (error) throw error;
  return data.map((row) => ({
    slug: row.slug,
    name: localizedText.parse(row.name),
    icon: row.icon,
    openPositions: row.open_positions,
  }));
}
