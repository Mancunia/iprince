import "server-only";
import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { lastModifiedOf } from "@/lib/seo";
import { createServerSupabase } from "@/lib/supabase/server";
import { pageRange } from "./paging";
import { SLUG_PATTERN, type BlogCta } from "./schema";
import { postLocales, storedText, type StoredText } from "./text";

export type LiveCategory = { id: string; slug: string; name: StoredText; cta: BlogCta };
export type LivePost = {
  id: string;
  slug: string;
  title: StoredText;
  excerpt: StoredText;
  body: StoredText;
  coverPath: string | null;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
  isFeatured: boolean;
  category: LiveCategory | null;
};

type Supabase = Awaited<ReturnType<typeof createServerSupabase>>;

const COLUMNS = "id, slug, title, excerpt, body, cover_path, author_name, published_at, updated_at, is_featured, category:blog_categories(id, slug, name, cta)";

/** Live posts only. Explicit filters: public reads must not depend on the session (RLS shows admins every post). */
function selectLive(supabase: Supabase, withCount = false) {
  return supabase
    .from("blog_posts")
    .select(COLUMNS, withCount ? { count: "exact" } : undefined)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString());
}

type Row = {
  id: string;
  slug: string;
  title: unknown;
  excerpt: unknown;
  body: unknown;
  cover_path: string | null;
  author_name: string;
  published_at: string | null;
  updated_at: string;
  is_featured: boolean;
  category: { id: string; slug: string; name: unknown; cta: BlogCta } | null;
};

function toLivePost(row: Row): LivePost {
  return {
    id: row.id,
    slug: row.slug,
    title: storedText.parse(row.title),
    excerpt: storedText.parse(row.excerpt),
    body: storedText.parse(row.body),
    coverPath: row.cover_path,
    authorName: row.author_name,
    publishedAt: row.published_at ?? "",
    updatedAt: row.updated_at,
    isFeatured: row.is_featured,
    category: row.category ? { ...row.category, name: storedText.parse(row.category.name) } : null,
  };
}

/** One page of live posts, newest first. A page past the end yields no posts and total 0, so the page 404s. */
export async function listLivePosts({ categoryId, page, excludeId }: { categoryId?: string; page: number; excludeId?: string }): Promise<{ posts: LivePost[]; total: number }> {
  const supabase = await createServerSupabase();
  const { from, to } = pageRange(page);
  let query = selectLive(supabase, true);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error, count } = await query.order("published_at", { ascending: false }).order("id").range(from, to);
  // PostgREST answers 416 (PGRST103) when the offset is past the last row.
  if (error?.code === "PGRST103") return { posts: [], total: 0 };
  if (error) throw error;
  return { posts: data.map(toLivePost), total: count ?? 0 };
}

/** The newest featured live post, shown as the /blog hero. */
export async function getFeaturedPost(): Promise<LivePost | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await selectLive(supabase).eq("is_featured", true).order("published_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? toLivePost(data) : null;
}

/** Cached per request: generateMetadata and the page both read it. */
export const getLivePost = cache(async (slug: string): Promise<LivePost | null> => {
  if (!SLUG_PATTERN.test(slug)) return null;
  const supabase = await createServerSupabase();
  const { data, error } = await selectLive(supabase).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? toLivePost(data) : null;
});

export async function listRelated(categoryId: string, excludeId: string): Promise<LivePost[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await selectLive(supabase)
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(3);
  if (error) throw error;
  return data.map(toLivePost);
}

/** Categories with at least one live post, for the filter chips. */
export async function listUsedCategories(): Promise<LiveCategory[]> {
  const supabase = await createServerSupabase();
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("category_id")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .not("category_id", "is", null);
  if (error) throw error;
  const ids = [...new Set(posts.map((post) => post.category_id).filter((id): id is string => id !== null))];
  if (ids.length === 0) return [];
  const { data, error: categoryError } = await supabase.from("blog_categories").select("id, slug, name, cta").in("id", ids).order("slug");
  if (categoryError) throw categoryError;
  return data.map((row) => ({ id: row.id, slug: row.slug, name: storedText.parse(row.name), cta: row.cta }));
}

/** Every live post for sitemap.xml: when it last changed and which languages it has its own text in. */
export async function listSitemapPosts(): Promise<{ slug: string; lastModified: string; available: Locale[] }[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, title, body, published_at, updated_at")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    slug: row.slug,
    lastModified: lastModifiedOf(row.published_at ?? row.updated_at, row.updated_at),
    available: postLocales({ title: storedText.parse(row.title), body: storedText.parse(row.body) }),
  }));
}
