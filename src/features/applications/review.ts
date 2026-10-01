import type { Locale } from "@/i18n/config";
import type { FormDefinition } from "@/features/forms/definition";
import { localized } from "@/lib/i18n/localized";
import type { StatusTone } from "@/ui/Status";

export const APPLICATION_STATUSES = ["new", "reviewing", "contacted", "placed", "rejected", "archived"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Human-readable answers using the exact form version the applicant saw. */
export function describeAnswers(
  def: FormDefinition,
  answers: Record<string, unknown>,
  locale: Locale,
  yesNo: { yes: string; no: string },
): { key: string; label: string; value: string }[] {
  return def.fields.flatMap((field) => {
    if (field.type === "file") return [];
    const raw = answers[field.key];
    if (raw === undefined || raw === null || raw === "" || (Array.isArray(raw) && raw.length === 0)) return [];
    const optionLabel = (value: unknown) => {
      const option = field.options?.find((o) => o.value === value);
      return option ? localized(option.label, locale) : String(value);
    };
    let value: string;
    if (field.type === "checkbox") value = raw === true ? yesNo.yes : yesNo.no;
    else if (Array.isArray(raw)) value = raw.map(optionLabel).join(", ");
    else if (field.type === "select" || field.type === "radio") value = optionLabel(raw);
    else value = String(raw);
    return [{ key: field.key, label: localized(field.label, locale), value }];
  });
}

/** Pill colour for each status in admin lists. */
export const STATUS_TONE = {
  new: "new",
  reviewing: "review",
  contacted: "review",
  placed: "ok",
  rejected: "error",
  archived: "draft",
} as const satisfies Record<ApplicationStatus, StatusTone>;
