"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { requireOwner } from "@/features/admin-auth/session";
import { fail, fieldErrorsOf, ok, type ActionResult } from "@/lib/result";
import { authAdmin } from "@/lib/supabase/auth-admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { canRemove, inviteInput, inviteRedirectUrl } from "./team";

type Result = ActionResult<null>;
const localeOf = (formData: FormData) => z.enum(locales).catch("en").parse(formData.get("locale"));

export async function inviteEditor(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireOwner(locale);
  const parsed = inviteInput.safeParse({ email: formData.get("email"), displayName: formData.get("displayName") });
  if (!parsed.success) return fail("invalid", fieldErrorsOf(parsed.error.issues));

  // Next checks that server-action requests come from this host, so Origin is trustworthy here.
  const origin = (await headers()).get("origin");
  if (!origin) return fail("server_error");

  const admin = authAdmin();
  const { data, error } = await admin.inviteUserByEmail(parsed.data.email, { redirectTo: inviteRedirectUrl(origin, locale) });
  if (error) {
    if (error.code === "email_exists" || error.status === 422) return fail("invalid", { email: ["exists"] });
    console.error("invite failed", error.code ?? error.status);
    return fail("server_error");
  }

  // Insert with the owner's session so RLS (owner-only writes on admins) still applies.
  const supabase = await createServerSupabase();
  const { error: insertError } = await supabase
    .from("admins")
    .insert({ user_id: data.user.id, role: "editor", display_name: parsed.data.displayName });
  if (insertError) {
    console.error("admins insert failed", insertError.code);
    await admin.deleteUser(data.user.id); // no auth user without an admins row
    return fail("server_error");
  }
  revalidatePath(`/${locale}/admin/team`);
  return ok(null);
}

export async function removeEditor(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  const owner = await requireOwner(locale);
  const userId = z.guid().safeParse(formData.get("userId"));
  if (!userId.success) return fail("invalid");

  const supabase = await createServerSupabase();
  const { data: target, error } = await supabase.from("admins").select("user_id, role").eq("user_id", userId.data).maybeSingle();
  if (error) {
    console.error("read admin failed", error.code);
    return fail("server_error");
  }
  if (!target) return fail("not_found");
  if (!canRemove({ userId: target.user_id, role: target.role }, owner.userId)) return fail("not_allowed");

  // Deleting the auth user cascades to admins; getAdminSession() then rejects their next request.
  const { error: deleteError } = await authAdmin().deleteUser(target.user_id);
  if (deleteError) {
    console.error("delete user failed", deleteError.code ?? deleteError.status);
    return fail("server_error");
  }
  revalidatePath(`/${locale}/admin/team`);
  return ok(null);
}
