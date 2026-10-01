"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { fail, fieldErrorsOf, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import { canActivate, readProfessionForm, toProfessionRow } from "./admin";
import { listIconNames } from "./admin-queries";

type Result = ActionResult<null>;

const localeOf = (formData: FormData) => z.enum(locales).catch("en").parse(formData.get("locale"));

function dbFailure(error: PostgrestError, what: string): Result {
  if (error.code === "23505") return fail("invalid", { slug: ["taken"] });
  console.error(`${what} failed`, error);
  return fail("server_error");
}

async function parse(formData: FormData) {
  const parsed = readProfessionForm(formData);
  if (!parsed.success) return { error: fail("invalid", fieldErrorsOf(parsed.error.issues)) } as const;
  if (!(await listIconNames()).includes(parsed.data.icon)) return { error: fail("invalid", { icon: ["invalid"] }) } as const;
  return { data: parsed.data } as const;
}

export async function createProfession(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const parsed = await parse(formData);
  if (parsed.error) return parsed.error;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("professions")
    .insert({ ...toProfessionRow(parsed.data), is_active: false })
    .select("id")
    .single();
  if (error) return dbFailure(error, "create profession");
  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/professions/${data.id}/form`);
}

export async function updateProfession(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const id = z.guid().safeParse(formData.get("id"));
  if (!id.success) return fail("invalid");
  const parsed = await parse(formData);
  if (parsed.error) return parsed.error;

  const supabase = await createServerSupabase();
  const { data: current, error: readError } = await supabase
    .from("professions")
    .select("current_form_id")
    .eq("id", id.data)
    .maybeSingle();
  if (readError) return dbFailure(readError, "read profession");
  if (!current) return fail("not_found");
  if (!canActivate(parsed.data.isActive, current.current_form_id)) return fail("invalid", { isActive: ["form_required"] });

  const { data, error } = await supabase.from("professions").update(toProfessionRow(parsed.data)).eq("id", id.data).select("id");
  if (error) return dbFailure(error, "update profession");
  if (data.length === 0) return fail("not_found");
  revalidatePath("/", "layout");
  return ok(null);
}

export async function deleteProfession(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const id = z.guid().safeParse(formData.get("id"));
  if (!id.success) return fail("invalid");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("professions").delete().eq("id", id.data).select("id");
  if (error?.code === "23503") return fail("has_applications");
  if (error) return dbFailure(error, "delete profession");
  if (data.length === 0) return fail("not_found");
  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/professions`);
}
