import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { siteUrl } from "@/lib/site-url";

/** Only the production deployment is indexed; previews and local dev tell crawlers to stay out. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== "production") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...locales.map((locale) => `/${locale}/admin`), "/api/"] },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
