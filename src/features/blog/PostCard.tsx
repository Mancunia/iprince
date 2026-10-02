import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { Photo } from "@/features/site/Photo";
import { localized } from "@/lib/i18n/localized";
import { coverSrc } from "./cover-url";
import { PostMeta } from "./PostMeta";
import type { LivePost } from "./queries";
import { localizePost } from "./text";

export function PostCard({ post, locale }: { post: LivePost; locale: Locale }) {
  const text = localizePost(post, locale);
  const lang = text.fallback ? "de" : undefined;
  return (
    <Link href={`/blog/${post.slug}`} className="card w-full gap-0 overflow-hidden p-0">
      <Photo
        src={coverSrc(post.coverPath)}
        alt=""
        icon="book-open"
        className="aspect-[16/9] rounded-none"
        sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
      />
      <span className="flex flex-1 flex-col gap-3 p-6">
        {post.category ? <span className="tag max-w-max">{localized(post.category.name, locale)}</span> : null}
        <span className="card-title" lang={lang}>{text.title}</span>
        {text.excerpt ? <span className="line-clamp-3 text-fg-muted" lang={lang}>{text.excerpt}</span> : null}
        <PostMeta publishedAt={post.publishedAt} body={text.body} className="mt-auto pt-2" />
      </span>
    </Link>
  );
}
