"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { locales, type Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { fail, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import { leadUpdate, messageUpdate } from "./schema";

type Result = ActionResult<null>;
const localeOf = (formData: FormData): Locale => z.enum(locales).catch("en").parse(formData.get("locale"));
// The layout holds the nav badges, so every change revalidates the whole admin tree.
const revalidateAdmin = (locale: Locale) => revalidatePath(`/${locale}/admin`, "layout");

export async function updateLead(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const parsed = leadUpdate.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("invalid");
  const { id, status, adminNotes } = parsed.data;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("employer_leads").update({ status, admin_notes: adminNotes }).eq("id", id).select("id");
  if (error) {
    console.error("update lead failed", error.code);
    return fail("server_error");
  }
  if (data.length === 0) return fail("not_found");
  revalidateAdmin(locale);
  return ok(null);
}

export async function updateMessage(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const parsed = messageUpdate.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("invalid");
  const { id, status } = parsed.data;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("contact_messages").update({ status }).eq("id", id).select("id");
  if (error) {
    console.error("update message failed", error.code);
    return fail("server_error");
  }
  if (data.length === 0) return fail("not_found");
  revalidateAdmin(locale);
  return ok(null);
}

export async function deleteLead(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const id = z.guid().safeParse(formData.get("id"));
  if (!id.success) return fail("invalid");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("employer_leads").delete().eq("id", id.data).select("id");
  if (error) {
    console.error("delete lead failed", error.code);
    return fail("server_error");
  }
  if (data.length === 0) return fail("not_found");
  revalidateAdmin(locale);
  redirect(`/${locale}/admin/leads`);
}

export async function deleteMessage(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const id = z.guid().safeParse(formData.get("id"));
  if (!id.success) return fail("invalid");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("contact_messages").delete().eq("id", id.data).select("id");
  if (error) {
    console.error("delete message failed", error.code);
    return fail("server_error");
  }
  if (data.length === 0) return fail("not_found");
  revalidateAdmin(locale);
  redirect(`/${locale}/admin/messages`);
}
