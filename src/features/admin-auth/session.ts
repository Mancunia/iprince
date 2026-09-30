import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { createServerSupabase } from "@/lib/supabase/server";

export type AdminSession = { userId: string; role: "owner" | "editor"; displayName: string };

/** The signed-in admin, or null. getUser() re-validates the JWT with Supabase Auth on every request. */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: admin } = await supabase
    .from("admins")
    .select("role, display_name")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  return admin ? { userId: auth.user.id, role: admin.role, displayName: admin.display_name } : null;
});

export async function requireAdmin(locale: Locale): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  return session;
}
