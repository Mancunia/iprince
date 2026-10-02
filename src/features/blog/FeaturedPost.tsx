import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { Photo } from "@/features/site/Photo";
import { localized } from "@/lib/i18n/localized";
import { coverSrc } from "./cover-url";
import { PostMeta } from "./PostMeta";
import type { LivePost } from "./queries";
import { localizePost } from "./text";

export async function FeaturedPost({ post, locale }: { post: LivePost; locale: Locale }) {
  const t = await getTranslations("blog");
  const text = localizePost(post, locale);
  const lang = text.fallback ? "de" : undefined;
  return (
    <Link href={`/blog/${post.slug}`} className="card gap-0 overflow-hidden p-0 md:grid md:grid-cols-2">
      <Photo
        src={coverSrc(post.coverPath)}
        alt=""
        icon="book-open"
        priority
        className="aspect-[16/9] rounded-none md:aspect-auto md:h-full md:min-h-80"
        sizes="(min-width: 768px) 600px, 100vw"
      />
      <span className="grid content-center gap-4 p-6 md:p-10">
        <span className="flex flex-wrap gap-2">
          <span className="tag tag-gold">{t("featured")}</span>
          {post.category ? <span className="tag">{localized(post.category.name, locale)}</span> : null}
        </span>
        <h2 className="text-3xl" lang={lang}>{text.title}</h2>
        {text.excerpt ? <span className="lead" lang={lang}>{text.excerpt}</span> : null}
        <PostMeta publishedAt={post.publishedAt} body={text.body} />
      </span>
    </Link>
  );
}
