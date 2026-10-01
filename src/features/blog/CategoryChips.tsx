import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { localized } from "@/lib/i18n/localized";
import type { LiveCategory } from "./queries";

/** Category filter as plain links to ?category=…, so it works without JavaScript. */
export async function CategoryChips({ categories, current, locale }: { categories: LiveCategory[]; current?: string; locale: Locale }) {
  if (categories.length === 0) return null;
  const t = await getTranslations("blog");
  return (
    <nav aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
      <Link href="/blog" className="tab" aria-current={current === undefined ? "page" : undefined}>{t("all")}</Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={{ pathname: "/blog", query: { category: category.slug } }}
          className="tab"
          aria-current={current === category.slug ? "page" : undefined}
        >
          {localized(category.name, locale)}
        </Link>
      ))}
    </nav>
  );
}
