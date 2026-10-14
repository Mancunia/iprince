import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { CategoryChips } from "@/features/blog/CategoryChips";
import { FeaturedPost } from "@/features/blog/FeaturedPost";
import { Pagination } from "@/features/blog/Pagination";
import { pageCount, parsePage } from "@/features/blog/paging";
import { PostCard } from "@/features/blog/PostCard";
import { getFeaturedPost, listLivePosts, listUsedCategories } from "@/features/blog/queries";
import { sitePageMetadata } from "@/features/seo/metadata";
import { Icon } from "@/ui/Icon";

type Params = { params: Promise<{ locale: Locale }> };
type Props = Params & { searchParams: Promise<{ category?: string | string[]; page?: string | string[] }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return sitePageMetadata({ locale, path: "/blog", title: t("title"), description: t("lead") });
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const page = parsePage(query.page);
  if (page === null) notFound();
  const categorySlug = typeof query.category === "string" ? query.category : undefined;

  const [t, categories] = await Promise.all([getTranslations("blog"), listUsedCategories()]);
  // undefined: no filter; null: a category without live posts (or unknown), shown as an empty list.
  const category = categorySlug === undefined ? undefined : (categories.find((c) => c.slug === categorySlug) ?? null);
  // The hero is left out of the unfiltered list on every page, so paging stays stable.
  const featured = categorySlug === undefined ? await getFeaturedPost() : null;
  const { posts, total } = category === null
    ? { posts: [], total: 0 }
    : await listLivePosts({ categoryId: category?.id, page, excludeId: featured?.id });
  const pages = pageCount(total);
  if (page > pages) notFound();
  const hero = page === 1 ? featured : null;

  return (
    <>
      <section className="bg-accent-100/60">
        <div className="container-page grid gap-5 py-14 md:py-20">
          <p className="eyebrow">{t("kicker")}</p>
          <h1 className="text-3xl">{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
          <CategoryChips categories={categories} current={categorySlug} locale={locale} />
        </div>
      </section>
      <section className="container-page grid gap-10 py-14 pb-24 md:py-20">
        {hero ? <FeaturedPost post={hero} locale={locale} /> : null}
        {posts.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id} className="flex">
                <PostCard post={post} locale={locale} />
              </li>
            ))}
          </ul>
        ) : hero ? null : (
          <p className="notice notice-info">
            <Icon name="info" />
            {t(categorySlug === undefined ? "empty" : "emptyCategory")}
          </p>
        )}
        <Pagination page={page} pages={pages} category={categorySlug} />
      </section>
    </>
  );
}
