import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { coverSrc } from "@/features/blog/cover-url";
import { PostCard } from "@/features/blog/PostCard";
import { PostCta } from "@/features/blog/PostCta";
import { PostMeta } from "@/features/blog/PostMeta";
import { getLivePost, listRelated } from "@/features/blog/queries";
import { localizePost } from "@/features/blog/text";
import { JsonLd } from "@/features/seo/JsonLd";
import { sitePageMetadata } from "@/features/seo/metadata";
import { Photo } from "@/features/site/Photo";
import { localized } from "@/lib/i18n/localized";
import { Icon } from "@/ui/Icon";
import { Markdown } from "@/ui/Markdown";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getLivePost(slug);
  if (!post) return {};
  const text = localizePost(post, locale);
  const meta = await sitePageMetadata({
    locale,
    path: `/blog/${post.slug}`,
    title: text.title,
    description: text.excerpt || undefined,
    image: coverSrc(post.coverPath) ?? undefined,
    type: "article",
  });
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: post.publishedAt, modifiedTime: post.updatedAt } };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await getLivePost(slug);
  if (!post) notFound();
  const [t, related] = await Promise.all([
    getTranslations("blog"),
    post.category ? listRelated(post.category.id, post.id) : Promise.resolve([]),
  ]);
  const text = localizePost(post, locale);
  const lang = text.fallback ? "de" : undefined;
  const cover = coverSrc(post.coverPath);
  const origin = siteUrl();
  const posting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: text.title,
    ...(text.excerpt ? { description: text.excerpt } : {}),
    inLanguage: lang ?? locale,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    image: new URL(cover ?? DEFAULT_OG_IMAGE, origin).href,
    author: { "@type": "Person", name: post.authorName },
    mainEntityOfPage: new URL(`/${locale}/blog/${post.slug}`, origin).href,
  };

  return (
    <>
      <JsonLd data={posting} />
      <article className="container-page grid gap-8 py-14 pb-24 md:py-20">
        <Link href="/blog" className="btn btn-ghost btn-sm -ml-3 max-w-max">
          <Icon name="arrow-left" size={16} />
          {t("back")}
        </Link>
        <header className="grid max-w-[72ch] gap-4">
          {post.category ? (
            <Link href={{ pathname: "/blog", query: { category: post.category.slug } }} className="tag max-w-max no-underline">
              {localized(post.category.name, locale)}
            </Link>
          ) : null}
          <h1 className="text-3xl" lang={lang}>{text.title}</h1>
          <p><PostMeta publishedAt={post.publishedAt} body={text.body} author={post.authorName} /></p>
        </header>
        {text.fallback ? (
          <p className="notice notice-info max-w-[72ch]">
            <Icon name="info" />
            {t("germanOnly")}
          </p>
        ) : null}
        {cover ? <Photo src={cover} alt="" priority className="aspect-[16/9] max-w-4xl" sizes="(min-width: 960px) 896px, 100vw" /> : null}
        <div lang={lang}>
          <Markdown>{text.body}</Markdown>
        </div>
        <PostCta cta={post.category?.cta ?? "none"} />
      </article>
      {related.length > 0 ? (
        <section className="section section-tint">
          <div className="container-page grid gap-8">
            <h2>{t("related")}</h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id} className="flex">
                  <PostCard post={item} locale={locale} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
