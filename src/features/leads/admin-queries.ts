import "server-only";
import { z } from "zod";
import { INBOX_LIMIT } from "@/features/applications/admin-queries";
import { localizedText, type LocalizedText } from "@/lib/i18n/localized";
import { createServerSupabase } from "@/lib/supabase/server";
import { messagePreview, professionNames } from "./inbox";
import type { LeadStatus, MessageStatus } from "./schema";

type Client = Awaited<ReturnType<typeof createServerSupabase>>;

export type LeadRow = {
  id: string;
  company: string;
  contactName: string;
  status: LeadStatus;
  createdAt: string;
  professionNames: LocalizedText[];
};
export type LeadDetail = LeadRow & {
  email: string;
  phone: string | null;
  headcount: number | null;
  message: string;
  adminNotes: string;
};
export type MessageRow = { id: string; name: string; preview: string; status: MessageStatus; createdAt: string };
export type MessageDetail = { id: string; name: string; email: string; message: string; status: MessageStatus; createdAt: string };

/** All professions, inactive ones included, so old enquiries still show their names. */
async function professionLookup(supabase: Client): Promise<Map<string, LocalizedText>> {
  const { data, error } = await supabase.from("professions").select("id, name");
  if (error) throw error;
  const lookup = new Map<string, LocalizedText>();
  for (const row of data) {
    const name = localizedText.safeParse(row.name);
    if (name.success) lookup.set(row.id, name.data);
  }
  return lookup;
}

export async function listLeads(status?: LeadStatus): Promise<LeadRow[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("employer_leads")
    .select("id, company, contact_name, status, created_at, profession_ids")
    .order("created_at", { ascending: false })
    .limit(INBOX_LIMIT);
  if (status) query = query.eq("status", status);
  const [{ data, error }, lookup] = await Promise.all([query, professionLookup(supabase)]);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    company: row.company,
    contactName: row.contact_name,
    status: row.status,
    createdAt: row.created_at,
    professionNames: professionNames(row.profession_ids, lookup),
  }));
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  if (!z.guid().safeParse(id).success) return null;
  const supabase = await createServerSupabase();
  const [{ data: row, error }, lookup] = await Promise.all([
    supabase
      .from("employer_leads")
      .select("id, company, contact_name, email, phone, profession_ids, headcount, message, status, admin_notes, created_at")
      .eq("id", id)
      .maybeSingle(),
    professionLookup(supabase),
  ]);
  if (error) throw error;
  if (!row) return null;
  return {
    id: row.id,
    company: row.company,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    headcount: row.headcount,
    message: row.message,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    professionNames: professionNames(row.profession_ids, lookup),
  };
}

export async function listMessages(status?: MessageStatus): Promise<MessageRow[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("contact_messages")
    .select("id, name, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(INBOX_LIMIT);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    preview: messagePreview(row.message),
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getMessage(id: string): Promise<MessageDetail | null> {
  if (!z.guid().safeParse(id).success) return null;
  const supabase = await createServerSupabase();
  const { data: row, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, message: row.message, status: row.status, createdAt: row.created_at };
}
