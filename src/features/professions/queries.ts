import "server-only";
import { formDefinition, type FormDefinition } from "@/features/forms/definition";
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

export type ApplyFormData = { slug: string; name: LocalizedText; formId: string; definition: FormDefinition };

/** Active profession plus its current published form (RLS hides everything else from anon). */
export async function getApplyForm(slug: string): Promise<ApplyFormData | null> {
  const supabase = await createServerSupabase();
  const { data: profession } = await supabase
    .from("professions")
    .select("slug, name, current_form_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!profession?.current_form_id) return null;

  const { data: form } = await supabase
    .from("profession_forms")
    .select("id, schema")
    .eq("id", profession.current_form_id)
    .maybeSingle();
  if (!form) return null;

  const definition = formDefinition.safeParse(form.schema);
  if (!definition.success) {
    console.error(`profession_forms ${form.id} has an invalid schema`, definition.error.issues);
    return null;
  }
  return { slug: profession.slug, name: localizedText.parse(profession.name), formId: form.id, definition: definition.data };
}
