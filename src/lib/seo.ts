import type { Metadata, MetadataRoute } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

export const SITE_NAME = "iPrince Recruiting";
export const DEFAULT_OG_IMAGE = "/logo/iprince-mark.png";

const OG_LOCALE: Record<Locale, string> = { de: "de_DE", en: "en_US" };

/** Canonical plus hreflang links for a path that exists in every locale ("" is the home page). */
export function localeAlternates(locale: Locale, path: string) {
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])) as Record<Locale, string>;
  return { canonical: `/${locale}${path}`, languages: { ...languages, "x-default": `/${defaultLocale}${path}` } };
}

export type PageInput = {
  locale: Locale;
  path: string;
  title: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  siteName?: string;
  /** Skip the layout's "%s · site" template (the home page title already is the site name). */
  absoluteTitle?: boolean;
};

/** Title, description, alternates and social cards for one public page. Relative URLs resolve against metadataBase. */
export function pageMetadata({ locale, path, title, description, image, type = "website", siteName = SITE_NAME, absoluteTitle = false }: PageInput): Metadata & {
  openGraph: NonNullable<Metadata["openGraph"]>;
  twitter: NonNullable<Metadata["twitter"]>;
} {
  const alternates = localeAlternates(locale, path);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates,
    openGraph: {
      type,
      url: alternates.canonical,
      title,
      description,
      locale: OG_LOCALE[locale],
      siteName,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
  };
}

/** JSON for a ld+json script tag. `<` is escaped so stored text cannot close the tag (Next JSON-LD guide). */
export function jsonLdString(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const STATIC_PATHS = ["", "/employers", "/contact", "/blog", "/imprint", "/privacy"];

type SitemapInput = { professions: string[]; posts: { slug: string; updatedAt: string }[] };

/** Every public URL in every locale, each listing its language alternates. */
export function sitemapEntries(origin: URL, { professions, posts }: SitemapInput): MetadataRoute.Sitemap {
  const pages: { path: string; lastModified?: Date }[] = [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...professions.map((slug) => ({ path: `/apply/${slug}` })),
    ...posts.map((post) => ({ path: `/blog/${post.slug}`, lastModified: new Date(post.updatedAt) })),
  ];
  const url = (locale: Locale, path: string) => new URL(`/${locale}${path}`, origin).href;
  return pages.flatMap(({ path, lastModified }) =>
    locales.map((locale) => ({
      url: url(locale, path),
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, url(l, path)])) },
    })),
  );
}
