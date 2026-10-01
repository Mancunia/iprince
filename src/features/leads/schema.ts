import { z } from "zod";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "closed", "archived"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const MESSAGE_STATUSES = ["new", "read", "archived"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);
const requiredText = (max: number) => z.string().trim().min(1).max(max);
const email = z.string().trim().max(254).pipe(z.email());
const honeypot = z.string().max(1000); // real users never fill it

export const leadInput = z.object({
  company: requiredText(200),
  contactName: requiredText(200),
  email,
  phone: z.preprocess(blankToNull, z.string().trim().max(50).nullable()),
  professionIds: z
    .array(z.guid())
    .max(50)
    .transform((ids) => [...new Set(ids)]),
  headcount: z.preprocess(blankToNull, z.coerce.number().int().min(1).max(999).nullable()),
  message: z.string().trim().max(5000),
  hp_field: honeypot,
});
export type LeadInput = z.output<typeof leadInput>;

export const contactInput = z.object({
  name: requiredText(200),
  email,
  message: requiredText(5000),
  hp_field: honeypot,
});
export type ContactInput = z.output<typeof contactInput>;

export const leadUpdate = z.object({ id: z.guid(), status: z.enum(LEAD_STATUSES), adminNotes: z.string().max(5000) });
export const messageUpdate = z.object({ id: z.guid(), status: z.enum(MESSAGE_STATUSES) });

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export function leadFromForm(formData: FormData): Record<string, unknown> {
  return {
    company: text(formData, "company"),
    contactName: text(formData, "contactName"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    professionIds: formData.getAll("professionIds").filter((v): v is string => typeof v === "string"),
    headcount: text(formData, "headcount"),
    message: text(formData, "message"),
    hp_field: text(formData, "hp_field"),
  };
}

export function contactFromForm(formData: FormData): Record<string, unknown> {
  return {
    name: text(formData, "name"),
    email: text(formData, "email"),
    message: text(formData, "message"),
    hp_field: text(formData, "hp_field"),
  };
}

/** Drops ids that are not (or no longer) active professions instead of rejecting the enquiry. */
export function keepKnownIds(ids: string[], known: string[]): string[] {
  const allowed = new Set(known);
  return ids.filter((id) => allowed.has(id));
}
