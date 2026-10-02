import { z } from "zod";
import { berlinInputToUtc, resolvePublishedAt, type PostStatus } from "./publish";

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG_MAX = 80;
export const EXCERPT_MAX = 300;
export const BLOG_CTAS = ["candidates", "employers", "none"] as const;
export type BlogCta = (typeof BLOG_CTAS)[number];
export const POST_STATUSES = ["draft", "published"] as const satisfies readonly PostStatus[];

const slug = z.string().trim().max(SLUG_MAX).regex(SLUG_PATTERN);

export const postInput = z.object({
  slug,
  titleDe: z.string().trim().min(1).max(160),
  titleEn: z.string().trim().max(160),
  excerptDe: z.string().trim().max(EXCERPT_MAX),
  excerptEn: z.string().trim().max(EXCERPT_MAX),
  bodyDe: z.string().max(50_000),
  bodyEn: z.string().max(50_000),
  categoryId: z.union([z.guid(), z.literal("")]),
  authorName: z.string().trim().min(1).max(80),
  status: z.enum(POST_STATUSES),
  publishedAt: z.string().trim().refine((value) => value === "" || berlinInputToUtc(value) !== null),
  isFeatured: z.boolean(),
});
export type PostInput = z.infer<typeof postInput>;

export const EMPTY_POST: PostInput = {
  slug: "", titleDe: "", titleEn: "", excerptDe: "", excerptEn: "", bodyDe: "", bodyEn: "",
  categoryId: "", authorName: "iPrince", status: "draft", publishedAt: "", isFeatured: false,
};

/** Reads PostForm's FormData. The featured checkbox is present only when ticked. */
export function readPostForm(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "");
  return postInput.safeParse({
    slug: text("slug"),
    titleDe: text("titleDe"),
    titleEn: text("titleEn"),
    excerptDe: text("excerptDe"),
    excerptEn: text("excerptEn"),
    bodyDe: text("bodyDe"),
    bodyEn: text("bodyEn"),
    categoryId: text("categoryId"),
    authorName: text("authorName"),
    status: text("status"),
    publishedAt: text("publishedAt"),
    isFeatured: formData.get("isFeatured") === "on",
  });
}

export function toPostRow(input: PostInput, now: Date) {
  return {
    slug: input.slug,
    title: { de: input.titleDe, en: input.titleEn },
    excerpt: { de: input.excerptDe, en: input.excerptEn },
    body: { de: input.bodyDe, en: input.bodyEn },
    category_id: input.categoryId || null,
    author_name: input.authorName,
    status: input.status,
    published_at: resolvePublishedAt(input.status, input.publishedAt, now),
    is_featured: input.isFeatured,
  };
}

export const categoryInput = z.object({
  slug,
  nameDe: z.string().trim().min(1).max(60),
  nameEn: z.string().trim().max(60),
  cta: z.enum(BLOG_CTAS),
});
export type CategoryInput = z.infer<typeof categoryInput>;

export const EMPTY_CATEGORY: CategoryInput = { slug: "", nameDe: "", nameEn: "", cta: "none" };

export function readCategoryForm(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "");
  return categoryInput.safeParse({ slug: text("slug"), nameDe: text("nameDe"), nameEn: text("nameEn"), cta: text("cta") });
}

export function toCategoryRow(input: CategoryInput) {
  return { slug: input.slug, name: { de: input.nameDe, en: input.nameEn }, cta: input.cta };
}

const UMLAUTS: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };

/** URL slug from a (German) title: umlauts spelled out, accents dropped, anything else becomes single hyphens. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => UMLAUTS[char])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, SLUG_MAX)
    .replace(/^-+|-+$/g, "");
}
