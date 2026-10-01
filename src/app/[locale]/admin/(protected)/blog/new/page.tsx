import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { listCategoriesForAdmin } from "@/features/blog/admin-queries";
import { PostForm } from "@/features/blog/PostForm";
import { EMPTY_POST } from "@/features/blog/schema";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";

export default async function NewPostPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, categories] = await Promise.all([getTranslations("admin"), listCategoriesForAdmin()]);
  const coverHint = (
    <Card className="gap-2">
      <h2 className="card-title">{t("blog.cover")}</h2>
      <Text tone="muted" size="sm">{t("blog.coverAfterSave")}</Text>
    </Card>
  );

  return (
    <>
      <AdminPageHeader title={t("blog.newPost")} back={{ href: "/admin/blog", label: t("blog.back") }} />
      <PostForm
        mode="create"
        locale={locale}
        values={EMPTY_POST}
        categories={categories.map((c) => ({ id: c.id, name: localized(c.name, locale) || c.values.slug }))}
        aside={coverHint}
      />
    </>
  );
}
