import type { Locale } from "@/i18n/config";

/** The generated share image for a post without a cover (src/app/api/og/blog). */
export function previewImagePath(locale: Locale, slug: string): string {
  return `/api/og/blog/${locale}/${slug}`;
}
