import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/ui/Icon";

export async function Pagination({ page, pages, category }: { page: number; pages: number; category?: string }) {
  if (pages <= 1) return null;
  const t = await getTranslations("blog");
  const href = (target: number) => ({
    pathname: "/blog",
    query: { ...(category ? { category } : {}), ...(target > 1 ? { page: String(target) } : {}) },
  });
  return (
    <nav aria-label={t("pagination")} className="flex flex-wrap items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn-sm" rel="prev">
          <Icon name="arrow-left" size={16} />
          {t("previous")}
        </Link>
      ) : <span />}
      <span className="text-sm text-fg-muted">{t("pageOf", { page, pages })}</span>
      {page < pages ? (
        <Link href={href(page + 1)} className="btn btn-sm" rel="next">
          {t("next")}
          <Icon name="arrow-right" size={16} />
        </Link>
      ) : <span />}
    </nav>
  );
}
