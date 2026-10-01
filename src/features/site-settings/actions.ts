"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { requireOwner } from "@/features/admin-auth/session";
import { fail, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import { chatProviderInput } from "./settings";

type Result = ActionResult<null>;

export async function updateChatProvider(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = z.enum(locales).catch("en").parse(formData.get("locale"));
  await requireOwner(locale);
  const provider = chatProviderInput.safeParse(formData.get("chatProvider"));
  if (!provider.success) return fail("invalid");

  // The owner's session keeps RLS (owner-only update) in force; select() reveals a silently filtered update.
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("site_settings").update({ chat_provider: provider.data }).eq("id", true).select("id");
  if (error || data.length === 0) {
    console.error("update site_settings failed", error?.code ?? "no row updated");
    return fail("server_error");
  }
  revalidatePath("/", "layout");
  return ok(null);
}
