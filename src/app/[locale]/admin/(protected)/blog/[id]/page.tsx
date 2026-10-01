import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { getPostForAdmin, listCategoriesForAdmin } from "@/features/blog/admin-queries";
import { PostForm } from "@/features/blog/PostForm";
import { localized } from "@/lib/i18n/localized";
import { Icon } from "@/ui/Icon";

export default async function EditPostPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, post, categories] = await Promise.all([getTranslations("admin"), getPostForAdmin(id), listCategoriesForAdmin()]);
  if (!post) notFound();
  const viewOnSite = post.state === "live" ? (
    <Link href={`/blog/${post.slug}`} className="btn btn-sm" target="_blank">
      <Icon name="external-link" size={16} />
      {t("blog.viewOnSite")}
    </Link>
  ) : null;

  return (
    <>
      <AdminPageHeader title={post.values.titleDe} back={{ href: "/admin/blog", label: t("blog.back") }} actions={viewOnSite} />
      <PostForm
        mode="edit"
        id={post.id}
        locale={locale}
        values={post.values}
        categories={categories.map((c) => ({ id: c.id, name: localized(c.name, locale) || c.values.slug }))}
      />
    </>
  );
}
