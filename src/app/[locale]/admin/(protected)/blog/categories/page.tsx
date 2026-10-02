import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { listCategoriesForAdmin } from "@/features/blog/admin-queries";
import { CategoryForm } from "@/features/blog/CategoryForm";
import { DeleteCategoryForm } from "@/features/blog/DeleteCategoryForm";
import { EMPTY_CATEGORY } from "@/features/blog/schema";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";

export default async function BlogCategoriesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, categories] = await Promise.all([getTranslations("admin"), listCategoriesForAdmin()]);

  return (
    <>
      <AdminPageHeader title={t("blog.categoriesTitle")} back={{ href: "/admin/blog", label: t("blog.back") }} />
      <div className="grid max-w-3xl gap-6">
        <Card className="gap-4">
          <h2 className="card-title">{t("blog.newCategory")}</h2>
          <CategoryForm mode="create" locale={locale} values={EMPTY_CATEGORY} />
        </Card>
        {categories.length === 0 ? (
          <Card><EmptyState icon="book-open" text={t("blog.emptyCategories")} /></Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id} className="gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="card-title">{localized(category.name, locale) || category.values.slug}</h2>
                <span className="text-sm text-fg-muted">{t("blog.postCount", { count: category.postCount })}</span>
              </div>
              <CategoryForm mode="edit" id={category.id} locale={locale} values={category.values} />
              <div className="border-t border-hairline pt-4">
                <DeleteCategoryForm id={category.id} locale={locale} postCount={category.postCount} />
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
