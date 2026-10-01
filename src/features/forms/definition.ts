import { z } from "zod";
import { localizedText } from "@/lib/i18n/localized";

export const FIELD_TYPES = [
  "text", "textarea", "email", "tel", "select", "multiselect", "radio", "checkbox", "date", "number", "language_level", "file",
] as const;
export const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "native"] as const;
export const MAX_FILE_MB = 20; // matches the `applications` bucket limit

/** Keys used by the fixed applicant fields and the honeypot. */
export const RESERVED_KEYS: readonly string[] = ["full_name", "fullName", "email", "phone", "website", "hp_field", "__proto__", "constructor", "prototype"];
const CHOICE_TYPES = new Set(["select", "multiselect", "radio"]);

const option = z.object({ value: z.string().min(1).max(100), label: localizedText });

export const formField = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/).refine((k) => !RESERVED_KEYS.includes(k), "reserved key"),
    type: z.enum(FIELD_TYPES),
    label: localizedText,
    help: localizedText.optional(),
    required: z.boolean().default(false),
    options: z.array(option).optional(),
    accept: z.array(z.string().regex(/^[a-z]+\/([a-z0-9.+-]+|\*)$/)).optional(),
    maxSizeMb: z.number().positive().max(MAX_FILE_MB).optional(),
    section: z.string().optional(),
  })
  .superRefine((field, ctx) => {
    if (CHOICE_TYPES.has(field.type) && !field.options?.length) {
      ctx.addIssue({ code: "custom", message: "options required", path: ["options"] });
    }
  });

export const formDefinition = z
  .object({
    sections: z.array(z.object({ id: z.string().min(1), title: localizedText })).optional(),
    fields: z.array(formField),
  })
  .superRefine((def, ctx) => {
    const seen = new Set<string>();
    def.fields.forEach((field, i) => {
      if (seen.has(field.key)) ctx.addIssue({ code: "custom", message: `duplicate key ${field.key}`, path: ["fields", i, "key"] });
      seen.add(field.key);
      if (field.section && !def.sections?.some((s) => s.id === field.section)) {
        ctx.addIssue({ code: "custom", message: `unknown section ${field.section}`, path: ["fields", i, "section"] });
      }
    });
  });

export type FormDefinition = z.infer<typeof formDefinition>;
export type FormField = z.infer<typeof formField>;
