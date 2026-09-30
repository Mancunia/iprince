"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { fail, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import { APPLICATION_STATUSES } from "./review";

const updateInput = z.object({
  id: z.guid(),
  locale: z.enum(locales),
  status: z.enum(APPLICATION_STATUSES),
  adminNotes: z.string().max(10000),
});

export async function updateApplication(_prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>> {
  const parsed = updateInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("invalid");
  const { id, locale, status, adminNotes } = parsed.data;
  await requireAdmin(locale);

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("applications").update({ status, admin_notes: adminNotes }).eq("id", id);
  if (error) {
    console.error("update application failed", error);
    return fail("server_error");
  }
  revalidatePath(`/${locale}/admin/applications`, "layout");
  return ok(null);
}
