import type { StatusTone } from "@/ui/Status";
import type { LeadStatus, MessageStatus } from "./schema";

/** Pill colour for each status in admin lists. */
export const LEAD_STATUS_TONE = {
  new: "new",
  contacted: "review",
  qualified: "review",
  closed: "ok",
  archived: "draft",
} as const satisfies Record<LeadStatus, StatusTone>;

export const MESSAGE_STATUS_TONE = { new: "new", read: "ok", archived: "draft" } as const satisfies Record<MessageStatus, StatusTone>;

/** Names for the stored profession ids; ids of deleted professions are skipped. */
export function professionNames<T>(ids: string[], lookup: Map<string, T>): T[] {
  return ids.flatMap((id) => {
    const name = lookup.get(id);
    return name === undefined ? [] : [name];
  });
}

/** One-line preview for lists, cut by code point so emoji stay intact. */
export function messagePreview(text: string, max = 80): string {
  const chars = Array.from(text.replace(/\s+/g, " ").trim());
  return chars.length <= max ? chars.join("") : `${chars.slice(0, max).join("")}…`;
}

export function telHref(phone: string): string {
  const trimmed = phone.trim();
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${trimmed.replace(/\D/g, "")}`;
}
