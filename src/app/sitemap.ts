import type { MetadataRoute } from "next";
import { listSitemapPosts } from "@/features/blog/queries";
import { listActiveProfessions } from "@/features/professions/queries";
import { sitemapEntries } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";

/** Rendered per request (the Supabase client reads cookies), so new posts and professions appear without a deploy. Queries filter to public rows explicitly. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [professions, posts] = await Promise.all([listActiveProfessions(), listSitemapPosts()]);
  return sitemapEntries(siteUrl(), { professions: professions.map((p) => p.slug), posts });
}
