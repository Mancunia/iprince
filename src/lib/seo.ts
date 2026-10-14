import type { Metadata, MetadataRoute } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

export const DEFAULT_OG_IMAGE = "/logo/iprince-mark.png";

const OG_LOCALE: Record<Locale, string> = { de: "de_DE", en: "en_US" };

/**
 * Canonical plus hreflang links ("" is the home page). `available` lists the languages the content really exists in:
 * a URL whose content falls back to another language canonicalises to that language instead of claiming to be a translation.
 */
export function localeAlternates(locale: Locale, path: string, available: readonly Locale[] = locales) {
  const own = available.includes(locale) ? locale : available[0];
  const xDefault = available.includes(defaultLocale) ? defaultLocale : available[0];
  const languages = Object.fromEntries(available.map((l) => [l, `/${l}${path}`])) as Partial<Record<Locale, string>>;
  return { canonical: `/${own}${path}`, languages: { ...languages, "x-default": `/${xDefault}${path}` } };
}

/** When a post last changed for readers: a post scheduled after its last edit changed on publication. */
export function lastModifiedOf(publishedAt: string, updatedAt: string): string {
  return new Date(publishedAt) > new Date(updatedAt) ? publishedAt : updatedAt;
}

export type PageInput = {
  locale: Locale;
  path: string;
  title: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  siteName: string;
  /** Languages the content exists in (see localeAlternates). */
  available?: readonly Locale[];
  /** "summary_large_image" only suits a real cover; the square logo fallback crops badly. */
  card?: "summary" | "summary_large_image";
  /** Skip the layout's "%s · site" template (the home page title already is the site name). */
  absoluteTitle?: boolean;
};

/** Title, description, alternates and social cards for one public page. Relative URLs resolve against metadataBase. */
export function pageMetadata({ locale, path, title, description, image, type = "website", siteName, available, card = "summary_large_image", absoluteTitle = false }: PageInput): Metadata & {
  openGraph: NonNullable<Metadata["openGraph"]>;
  twitter: NonNullable<Metadata["twitter"]>;
} {
  const alternates = localeAlternates(locale, path, available);
  const contentLocale = available && !available.includes(locale) ? available[0] : locale;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates,
    openGraph: {
      type,
      url: alternates.canonical,
      title,
      description,
      locale: OG_LOCALE[contentLocale],
      siteName,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card, title, description, ...(image ? { images: [image] } : {}) },
  };
}

/** JSON for a ld+json script tag. `<` is escaped so stored text cannot close the tag (Next JSON-LD guide). */
export function jsonLdString(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const STATIC_PATHS = ["", "/employers", "/contact", "/blog", "/imprint", "/privacy"];

type SitemapPost = { slug: string; lastModified: string; available: readonly Locale[] };
type SitemapInput = { professions: string[]; posts: SitemapPost[] };

/** Every public URL in every language its content exists in, each listing its language alternates. */
export function sitemapEntries(origin: URL, { professions, posts }: SitemapInput): MetadataRoute.Sitemap {
  const pages: { path: string; lastModified?: Date; available: readonly Locale[] }[] = [
    ...STATIC_PATHS.map((path) => ({ path, available: locales })),
    ...professions.map((slug) => ({ path: `/apply/${slug}`, available: locales })),
    ...posts.map((post) => ({ path: `/blog/${post.slug}`, lastModified: new Date(post.lastModified), available: post.available })),
  ];
  const url = (locale: Locale, path: string) => new URL(`/${locale}${path}`, origin).href;
  return pages.flatMap(({ path, lastModified, available }) =>
    available.map((locale) => ({
      url: url(locale, path),
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: Object.fromEntries(available.map((l) => [l, url(l, path)])) },
    })),
  );
}
