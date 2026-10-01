import { z } from "zod";
import type { Locale } from "@/i18n/config";

/** Stored translations may lack a language; reads fill it with "" instead of failing. */
export const storedText = z.object({ de: z.string().default(""), en: z.string().default("") }).catch({ de: "", en: "" });
export type StoredText = z.infer<typeof storedText>;

export type PostText = { title: string; excerpt: string; body: string; fallback: boolean };

/** The post in the visitor's language. Without an English title or body the whole post is shown in German (fallback). */
export function localizePost(post: { title: StoredText; excerpt: StoredText; body: StoredText }, locale: Locale): PostText {
  const fallback = locale !== "de" && (!post.title[locale].trim() || !post.body[locale].trim());
  const lang = fallback ? "de" : locale;
  return {
    title: post.title[lang],
    excerpt: post.excerpt[lang].trim() || post.excerpt.de,
    body: post.body[lang],
    fallback,
  };
}
