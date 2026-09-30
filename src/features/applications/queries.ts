import "server-only";
import { formDefinition, type FormDefinition } from "@/features/forms/definition";
import type { ServiceClient } from "@/lib/supabase/service";
import { isSubmittableForm } from "./submission";

function parseDefinition(schema: unknown, formId: string): FormDefinition | null {
  const parsed = formDefinition.safeParse(schema);
  if (!parsed.success) {
    console.error(`profession_forms ${formId} has an invalid schema`, parsed.error.issues);
    return null;
  }
  return parsed.data;
}

/** The form an applicant submitted against, if it is still acceptable. */
export async function getFormForSubmission(supabase: ServiceClient, slug: string, formId: string) {
  const { data: profession } = await supabase
    .from("professions")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!profession) return null;

  const { data: form } = await supabase
    .from("profession_forms")
    .select("id, profession_id, published_at, schema")
    .eq("id", formId)
    .maybeSingle();
  if (!form || !isSubmittableForm({ professionId: form.profession_id, publishedAt: form.published_at }, profession.id)) return null;

  const definition = parseDefinition(form.schema, form.id);
  return definition ? { id: form.id, professionId: profession.id, definition } : null;
}

export async function getFormById(supabase: ServiceClient, formId: string): Promise<FormDefinition | null> {
  const { data } = await supabase.from("profession_forms").select("schema").eq("id", formId).maybeSingle();
  return data ? parseDefinition(data.schema, formId) : null;
}
