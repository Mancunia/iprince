import { z } from "zod";

export const professionInput = z.object({
  slug: z.string().trim().max(60).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  nameDe: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().max(120),
  summaryDe: z.string().trim().max(500),
  summaryEn: z.string().trim().max(500),
  icon: z.string().regex(/^[a-z0-9-]+$/),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
  openPositions: z.coerce.number().int().min(0).max(100_000),
});
export type ProfessionInput = z.infer<typeof professionInput>;

export const EMPTY_PROFESSION: ProfessionInput = {
  slug: "", nameDe: "", nameEn: "", summaryDe: "", summaryEn: "", icon: "briefcase",
  isActive: false, isFeatured: false, sortOrder: 0, openPositions: 0,
};

/** Reads ProfessionForm's FormData. Checkboxes are present only when ticked. */
export function readProfessionForm(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "");
  return professionInput.safeParse({
    slug: text("slug"),
    nameDe: text("nameDe"),
    nameEn: text("nameEn"),
    summaryDe: text("summaryDe"),
    summaryEn: text("summaryEn"),
    icon: text("icon"),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    sortOrder: text("sortOrder") || "0",
    openPositions: text("openPositions") || "0",
  });
}

export function toProfessionRow(input: ProfessionInput) {
  return {
    slug: input.slug,
    name: { de: input.nameDe, en: input.nameEn },
    summary: { de: input.summaryDe, en: input.summaryEn },
    icon: input.icon,
    is_active: input.isActive,
    is_featured: input.isFeatured,
    sort_order: input.sortOrder,
    open_positions: input.openPositions,
  };
}

/** A profession can go live only with a published form, otherwise its apply page would 404. */
export function canActivate(isActive: boolean, currentFormId: string | null): boolean {
  return !isActive || currentFormId !== null;
}

export type FormStatus = { kind: "none" } | { kind: "draft_only" } | { kind: "live"; version: number; draft: boolean };

export function formStatus(
  forms: { id: string; version: number; published_at: string | null }[],
  currentFormId: string | null,
): FormStatus {
  const draft = forms.some((f) => f.published_at === null);
  const current = forms.find((f) => f.id === currentFormId);
  if (current) return { kind: "live", version: current.version, draft };
  return draft ? { kind: "draft_only" } : { kind: "none" };
}
