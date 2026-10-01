"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { createServerSupabase } from "@/lib/supabase/server";
import { safeNextPath } from "./paths";

const input = z.object({
  token_hash: z.string().min(1).max(512),
  next: z.string().max(200).optional(),
  locale: z.enum(locales),
});

// The one-time token is spent here (on a user click), not on the emailed GET, so link scanners cannot burn it.
export async function acceptInvite(formData: FormData): Promise<void> {
  const parsed = input.safeParse(Object.fromEntries(formData));
  const locale = z.enum(locales).catch("en").parse(formData.get("locale"));
  const expired = `/${locale}/admin/login?notice=invite_expired`;
  if (!parsed.success) redirect(expired);

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ type: "invite", token_hash: parsed.data.token_hash });
  if (error) {
    console.error("invite verification failed", error.code ?? error.status);
    redirect(expired);
  }
  redirect(safeNextPath(parsed.data.next ?? null));
}
