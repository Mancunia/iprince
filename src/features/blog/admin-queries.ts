import "server-only";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { postState, utcToBerlinInput, type PostState } from "./publish";
import type { CategoryInput, PostInput } from "./schema";
import { storedText, type StoredText } from "./text";

export type AdminPostRow = {
  id: string;
  slug: string;
  title: StoredText;
  state: PostState;
  publishedAt: string | null;
  isFeatured: boolean;
  categoryName: StoredText | null;
};

/** All posts (a few a month, so no paging), undated drafts first, then newest. The state filter runs here because "scheduled" depends on now. */
export async function listPostsForAdmin(state?: PostState): Promise<AdminPostRow[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, status, published_at, is_featured, category:blog_categories(name)")
    .order("published_at", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const now = new Date();
  const rows = data.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: storedText.parse(row.title),
    state: postState(row.status, row.published_at, now),
    publishedAt: row.published_at,
    isFeatured: row.is_featured,
    categoryName: row.category ? storedText.parse(row.category.name) : null,
  }));
  return state ? rows.filter((row) => row.state === state) : rows;
}

export type AdminPost = { id: string; slug: string; state: PostState; coverPath: string | null; values: PostInput };

export async function getPostForAdmin(id: string): Promise<AdminPost | null> {
  if (!z.guid().safeParse(id).success) return null;
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, body, category_id, cover_path, author_name, status, published_at, is_featured")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const title = storedText.parse(data.title);
  const excerpt = storedText.parse(data.excerpt);
  const body = storedText.parse(data.body);
  return {
    id: data.id,
    slug: data.slug,
    state: postState(data.status, data.published_at, new Date()),
    coverPath: data.cover_path,
    values: {
      slug: data.slug,
      titleDe: title.de,
      titleEn: title.en,
      excerptDe: excerpt.de,
      excerptEn: excerpt.en,
      bodyDe: body.de,
      bodyEn: body.en,
      categoryId: data.category_id ?? "",
      authorName: data.author_name,
      status: data.status,
      publishedAt: utcToBerlinInput(data.published_at),
      isFeatured: data.is_featured,
    },
  };
}

export type AdminCategory = { id: string; name: StoredText; postCount: number; values: CategoryInput };

export async function listCategoriesForAdmin(): Promise<AdminCategory[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("blog_categories").select("id, slug, name, cta, blog_posts(count)").order("slug");
  if (error) throw error;
  return data.map((row) => {
    const name = storedText.parse(row.name);
    return {
      id: row.id,
      name,
      postCount: row.blog_posts[0]?.count ?? 0,
      values: { slug: row.slug, nameDe: name.de, nameEn: name.en, cta: row.cta },
    };
  });
}
