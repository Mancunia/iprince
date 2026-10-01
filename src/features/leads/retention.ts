import type { ServiceClient } from "@/lib/supabase/service";
import type { LeadStatus } from "./schema";

// Quoted in the privacy policy (2d). Any admin edit bumps updated_at and restarts the clock.
export const MESSAGE_RETENTION_MONTHS = 6;
export const LEAD_RETENTION_MONTHS = 12;
export const LEAD_EXPIRING_STATUSES = ["closed", "archived"] as const satisfies readonly LeadStatus[];

export type RetentionResult = { leadsDeleted: number; messagesDeleted: number };

/** Same day and time `months` calendar months earlier (UTC), clamped to the end of shorter months. */
export function monthsBefore(now: Date, months: number): Date {
  const target = new Date(now);
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(now.getUTCDate(), lastDay));
  return target;
}

export function retentionCutoffs(now: Date): { messages: string; leads: string } {
  return {
    messages: monthsBefore(now, MESSAGE_RETENTION_MONTHS).toISOString(),
    leads: monthsBefore(now, LEAD_RETENTION_MONTHS).toISOString(),
  };
}

/** Deletes contact messages and closed/archived enquiries past retention. Idempotent. */
export async function deleteExpired(supabase: ServiceClient, now: Date): Promise<RetentionResult> {
  const cutoffs = retentionCutoffs(now);
  const messages = await supabase.from("contact_messages").delete({ count: "exact" }).lt("updated_at", cutoffs.messages);
  if (messages.error) throw messages.error;
  const leads = await supabase
    .from("employer_leads")
    .delete({ count: "exact" })
    .in("status", [...LEAD_EXPIRING_STATUSES])
    .lt("updated_at", cutoffs.leads);
  if (leads.error) throw leads.error;
  return { leadsDeleted: leads.count ?? 0, messagesDeleted: messages.count ?? 0 };
}
