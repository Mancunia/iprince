import { z } from "zod";
import { locales } from "@/i18n/config";
import type { FileMeta } from "@/features/forms/files";

export const submissionInput = z.object({
  professionSlug: z.string().min(1).max(100),
  formId: z.guid(),
  locale: z.enum(locales),
  fullName: z.string().trim().min(2).max(200),
  email: z.email().max(320),
  phone: z.string().trim().max(50).optional().transform((v) => v || undefined),
  website: z.string().optional(), // honeypot: real users never fill it
  answers: z.record(z.string(), z.unknown()),
  files: z
    .array(z.object({ fieldKey: z.string().max(40), name: z.string().min(1).max(255), type: z.string().max(255), size: z.number().int() }))
    .max(10),
});
export type SubmissionInput = z.input<typeof submissionInput>;

export const finalizeInput = z.object({ applicationId: z.guid(), paths: z.array(z.string().max(500)).max(10) });
export type FinalizeInput = z.input<typeof finalizeInput>;

/** A form is submittable if it is a published version of the profession being applied to. */
export function isSubmittableForm(form: { professionId: string; publishedAt: string | null }, professionId: string): boolean {
  return form.professionId === professionId && form.publishedAt !== null;
}

/** Matches `<applicationId>/<fieldKey>/<file>` with no traversal. */
export function isOwnedPath(applicationId: string, path: string): boolean {
  const parts = path.split("/");
  return parts.length === 3 && parts[0] === applicationId && parts.every((p) => p !== "" && p !== "." && p !== "..");
}

const storageMeta = z.object({ size: z.number().int(), mimetype: z.string() });

/** Builds FileMeta from what Storage actually holds (never trust client-reported size/MIME). */
export function fileMetaFromStorage(path: string, meta: unknown): FileMeta | null {
  const parsed = storageMeta.safeParse(meta);
  if (!parsed.success) return null;
  const [, fieldKey, name] = path.split("/");
  return { fieldKey, name, type: parsed.data.mimetype, size: parsed.data.size };
}
