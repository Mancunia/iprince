"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { fail, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
  locale: z.enum(locales),
});

export async function signIn(_prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>> {
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("invalid_credentials");
  const { email, password, locale } = parsed.data;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return fail("invalid_credentials");

  const { data: admin } = await supabase.from("admins").select("id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return fail("not_admin");
  }
  redirect(`/${locale}/admin/applications`);
}

export async function signOut(formData: FormData): Promise<void> {
  const locale = z.enum(locales).catch("en").parse(formData.get("locale"));
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect(`/${locale}/admin/login`);
}
