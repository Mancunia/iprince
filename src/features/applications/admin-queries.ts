import "server-only";
import type { Locale } from "@/i18n/config";
import { formDefinition } from "@/features/forms/definition";
import { localized, localizedText, type LocalizedText } from "@/lib/i18n/localized";
import { createServerSupabase } from "@/lib/supabase/server";
import { describeAnswers, type ApplicationStatus } from "./review";

export type ApplicationRow = {
  id: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  submittedAt: string;
  professionName: LocalizedText;
};

export async function listApplications(status?: ApplicationStatus): Promise<ApplicationRow[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("applications")
    .select("id, full_name, email, status, submitted_at, profession:professions(name)")
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    status: row.status,
    submittedAt: row.submitted_at!,
    professionName: localizedText.parse(row.profession?.name),
  }));
}

export type ApplicationDetail = ApplicationRow & {
  phone: string | null;
  locale: string;
  adminNotes: string;
  answers: { key: string; label: string; value: string }[];
  files: { label: string; name: string; url: string | null }[];
};

export async function getApplicationDetail(
  id: string,
  locale: Locale,
  yesNo: { yes: string; no: string },
): Promise<ApplicationDetail | null> {
  const supabase = await createServerSupabase();
  const { data: row } = await supabase
    .from("applications")
    .select(
      "id, full_name, email, phone, locale, status, submitted_at, admin_notes, answers, profession:professions(name), form:profession_forms(schema), files:application_files(field_key, storage_path)",
    )
    .eq("id", id)
    .not("submitted_at", "is", null)
    .maybeSingle();
  if (!row) return null;

  const definition = formDefinition.safeParse(row.form?.schema);
  const fields = definition.success ? definition.data.fields : [];
  const fileLabel = (key: string) => {
    const field = fields.find((f) => f.key === key);
    return field ? localized(field.label, locale) : key;
  };

  const files = await Promise.all(
    row.files.map(async (file) => {
      const { data } = await supabase.storage.from("applications").createSignedUrl(file.storage_path, 600);
      return { label: fileLabel(file.field_key), name: file.storage_path.split("/").pop()!, url: data?.signedUrl ?? null };
    }),
  );

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    locale: row.locale,
    status: row.status,
    submittedAt: row.submitted_at!,
    adminNotes: row.admin_notes,
    professionName: localizedText.parse(row.profession?.name),
    answers: definition.success ? describeAnswers(definition.data, row.answers as Record<string, unknown>, locale, yesNo) : [],
    files,
  };
}
