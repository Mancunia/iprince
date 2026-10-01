import type { LeadStatus, MessageStatus } from "@/features/leads/schema";

export type InboxItem =
  | { kind: "lead"; id: string; title: string; status: LeadStatus; createdAt: string }
  | { kind: "message"; id: string; title: string; status: MessageStatus; createdAt: string };

type LeadLike = { id: string; company: string; status: LeadStatus; createdAt: string };
type MessageLike = { id: string; name: string; status: MessageStatus; createdAt: string };

/** Enquiries and contact messages as one list, newest first, at most `limit` items. */
export function mergeRecent(leads: LeadLike[], messages: MessageLike[], limit: number): InboxItem[] {
  const items: InboxItem[] = [
    ...leads.map((l) => ({ kind: "lead" as const, id: l.id, title: l.company, status: l.status, createdAt: l.createdAt })),
    ...messages.map((m) => ({ kind: "message" as const, id: m.id, title: m.name, status: m.status, createdAt: m.createdAt })),
  ];
  return items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, limit);
}
