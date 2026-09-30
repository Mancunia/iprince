import { z } from "zod";
import type { Locale } from "@/i18n/config";

export const localizedText = z.object({
  de: z.string().trim().min(1),
  en: z.string().trim().default(""),
});
export type LocalizedText = z.infer<typeof localizedText>;

export function localized(value: LocalizedText | null | undefined, locale: Locale): string {
  if (!value) return "";
  const text = value[locale]?.trim();
  return text ? text : value.de;
}
