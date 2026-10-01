import "server-only";
import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";

export type DashboardCounts = { applications: number; leads: number; messages: number; activeProfessions: number };

/** New entries per inbox plus active professions. Cached per request: the layout badges and the dashboard share it. */
export const countDashboard = cache(async (): Promise<DashboardCounts> => {
  const supabase = await createServerSupabase();
  const head = { count: "exact", head: true } as const;
  const [applications, leads, messages, professions] = await Promise.all([
    supabase.from("applications").select("id", head).eq("status", "new").not("submitted_at", "is", null),
    supabase.from("employer_leads").select("id", head).eq("status", "new"),
    supabase.from("contact_messages").select("id", head).eq("status", "new"),
    supabase.from("professions").select("id", head).eq("is_active", true),
  ]);
  for (const result of [applications, leads, messages, professions]) if (result.error) throw result.error;
  return {
    applications: applications.count ?? 0,
    leads: leads.count ?? 0,
    messages: messages.count ?? 0,
    activeProfessions: professions.count ?? 0,
  };
});
