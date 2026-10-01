import "server-only";
import { z } from "zod";
import type { LocalizedText } from "@/lib/i18n/localized";
import { createServerSupabase } from "@/lib/supabase/server";
import { formDefinition, type FormDefinition } from "./definition";

type StoredForm = { id: string; version: number; definition: FormDefinition };

export type BuilderData = {
  profession: { id: string; name: LocalizedText };
  live: StoredForm | null;
  draft: (StoredForm & { updatedAt: string }) | null;
  versions: (StoredForm & { publishedAt: string; applications: number })[];
};

const storedText = z.object({ de: z.string().default(""), en: z.string().default("") }).catch({ de: "", en: "" });

function readDefinition(id: string, schema: unknown): FormDefinition {
  const parsed = formDefinition.safeParse(schema);
  if (parsed.success) return parsed.data;
  console.error(`profession_forms ${id} has an invalid schema`, parsed.error.issues);
  return { fields: [] };
}

export async function getBuilderData(professionId: string): Promise<BuilderData | null> {
  if (!z.guid().safeParse(professionId).success) return null;
  const supabase = await createServerSupabase();
  const [profession, forms] = await Promise.all([
    supabase.from("professions").select("id, name, current_form_id").eq("id", professionId).maybeSingle(),
    supabase
      .from("profession_forms")
      .select("id, version, schema, published_at, updated_at, applications(count)")
      .eq("profession_id", professionId)
      .order("version", { ascending: false }),
  ]);
  if (profession.error) throw profession.error;
  if (forms.error) throw forms.error;
  const professionRow = profession.data;
  if (!professionRow) return null;

  const stored = forms.data.map((f) => ({ ...f, definition: readDefinition(f.id, f.schema) }));
  const draftRow = stored.find((f) => f.published_at === null);
  const liveRow = stored.find((f) => f.id === professionRow.current_form_id);
  const pick = (f: (typeof stored)[number]): StoredForm => ({ id: f.id, version: f.version, definition: f.definition });

  return {
    profession: { id: professionRow.id, name: storedText.parse(professionRow.name) },
    live: liveRow ? pick(liveRow) : null,
    draft: draftRow ? { ...pick(draftRow), updatedAt: draftRow.updated_at } : null,
    versions: stored
      .filter((f) => f.published_at !== null)
      .map((f) => ({ ...pick(f), publishedAt: f.published_at!, applications: f.applications[0]?.count ?? 0 })),
  };
}
