"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { locales, type Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import type { Json } from "@/lib/supabase/database.types";
import { fail, ok, type ActionResult, type Failure } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import { validateDefinition } from "./builder/model";
import type { FormDefinition } from "./definition";

export type DraftInput = { locale: Locale; formId: string; expectedUpdatedAt: string; definition: unknown };
type Saved = ActionResult<{ updatedAt: string }>;

const draftRef = z.object({ formId: z.guid(), expectedUpdatedAt: z.string().min(1).max(64) });
const localeOf = (value: unknown) => z.enum(locales).catch("en").parse(value);

export async function startFormDraft(formData: FormData): Promise<void> {
  const locale = localeOf(formData.get("locale"));
  await requireAdmin(locale);
  const professionId = z.guid().parse(formData.get("professionId"));
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("start_form_draft", { p_profession_id: professionId });
  if (error) {
    console.error("start_form_draft failed", error);
    throw new Error("Could not start a draft.");
  }
  revalidatePath(`/${locale}/admin/professions`, "layout");
  redirect(`/${locale}/admin/professions/${professionId}/form`);
}

async function writeDraft(formId: string, expectedUpdatedAt: string, definition: FormDefinition): Promise<Saved> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("profession_forms")
    .update({ schema: definition as unknown as NonNullable<Json> })
    .eq("id", formId)
    .is("published_at", null)
    .eq("updated_at", expectedUpdatedAt)
    .select("updated_at");
  if (error) {
    console.error("save draft failed", error);
    return fail("server_error");
  }
  return data.length === 1 ? ok({ updatedAt: data[0].updated_at }) : fail("stale");
}

type Prepared =
  | { error: Failure }
  | { error?: undefined; locale: Locale; formId: string; expectedUpdatedAt: string; definition: FormDefinition };

async function prepare(input: DraftInput): Promise<Prepared> {
  const locale = localeOf(input?.locale);
  await requireAdmin(locale);
  const ref = draftRef.safeParse(input);
  if (!ref.success) return { error: fail("invalid") };
  const definition = validateDefinition(input.definition);
  if (!definition.ok) return { error: fail("invalid", definition.errors) };
  return { locale, ...ref.data, definition: definition.data };
}

export async function saveFormDraft(input: DraftInput): Promise<Saved> {
  const prepared = await prepare(input);
  if (prepared.error) return prepared.error;
  const saved = await writeDraft(prepared.formId, prepared.expectedUpdatedAt, prepared.definition);
  if (saved.ok) revalidatePath(`/${prepared.locale}/admin/professions`, "layout");
  return saved;
}

export async function publishFormDraft(input: DraftInput): Promise<Saved> {
  const prepared = await prepare(input);
  if (prepared.error) return prepared.error;
  if (prepared.definition.fields.length === 0) return fail("empty_form");
  const saved = await writeDraft(prepared.formId, prepared.expectedUpdatedAt, prepared.definition);
  if (!saved.ok) return saved;

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("publish_form_draft", { p_form_id: prepared.formId, p_expected_updated_at: saved.data.updatedAt });
  if (error?.code === "P0002") return fail("stale");
  if (error) {
    console.error("publish_form_draft failed", error);
    return fail("server_error");
  }
  revalidatePath("/", "layout");
  return saved;
}

export async function discardFormDraft(input: { locale: Locale; formId: string }): Promise<ActionResult<null>> {
  const locale = localeOf(input?.locale);
  await requireAdmin(locale);
  const formId = z.guid().safeParse(input?.formId);
  if (!formId.success) return fail("invalid");
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("profession_forms").delete().eq("id", formId.data).is("published_at", null).select("id");
  if (error) {
    console.error("discard draft failed", error);
    return fail("server_error");
  }
  if (data.length === 0) return fail("not_found");
  revalidatePath(`/${locale}/admin/professions`, "layout");
  return ok(null);
}
