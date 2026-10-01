"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { locales, type Locale } from "@/i18n/config";
import { requireAdmin, requireOwner, type AdminSession } from "@/features/admin-auth/session";
import { fail, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { isLegalKey, isTextKey, keyFromSlug, type ContentKey } from "./content";
import { parseSectionForm } from "./form-data";

type Result = ActionResult<null>;

const localeOf = (formData: FormData) => z.enum(locales).catch("en").parse(formData.get("locale"));

/** Legal pages are owner-only; everything else is open to all admins. Runs before any other input is used. */
async function authorize(locale: Locale, formData: FormData): Promise<{ session: AdminSession; key: ContentKey } | null> {
  const slug = formData.get("section");
  const key = typeof slug === "string" ? keyFromSlug(slug) : null;
  const session = key && isLegalKey(key) ? await requireOwner(locale) : await requireAdmin(locale);
  return key ? { session, key } : null;
}

export async function saveSiteContent(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  const auth = await authorize(locale, formData);
  if (!auth || !(isTextKey(auth.key) || isLegalKey(auth.key))) return fail("invalid");
  const parsed = parseSectionForm(auth.key, formData);
  if (!parsed.success) return fail("invalid", parsed.fieldErrors);

  // The admin's session keeps RLS in force; select() reveals a write that RLS silently filtered.
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("site_content")
    .upsert({ key: auth.key, value: parsed.data as NonNullable<Json>, updated_by: auth.session.userId }, { onConflict: "key" })
    .select("key");
  if (error || data.length === 0) {
    console.error("save site_content failed", error?.code ?? "no row written");
    return fail("server_error");
  }
  revalidatePath("/", "layout");
  return ok(null);
}

/** Deletes the row so the default copy shows again. Not offered for legal pages or photos. */
export async function resetSiteContent(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  const auth = await authorize(locale, formData);
  if (!auth || !isTextKey(auth.key)) return fail("invalid");

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("site_content").delete().eq("key", auth.key);
  if (error) {
    console.error("reset site_content failed", error.code);
    return fail("server_error");
  }
  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/content`);
}
