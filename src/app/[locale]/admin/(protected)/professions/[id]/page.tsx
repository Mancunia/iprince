import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { getProfessionForAdmin, listIconNames } from "@/features/professions/admin-queries";
import { DeleteProfessionForm } from "@/features/professions/DeleteProfessionForm";
import { ProfessionForm } from "@/features/professions/ProfessionForm";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";

export default async function EditProfessionPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, icons, profession] = await Promise.all([getTranslations("admin.professions"), listIconNames(), getProfessionForAdmin(id)]);
  if (!profession) notFound();
  const editForm = (
    <Link href={`/admin/professions/${id}/form`} className="btn btn-sm">
      <Icon name="list-checks" size={16} />
      {t("editForm")}
    </Link>
  );

  return (
    <>
      <AdminPageHeader title={profession.values.nameDe} back={{ href: "/admin/professions", label: t("back") }} actions={editForm} />
      <Card className="max-w-3xl">
        <ProfessionForm mode="edit" id={id} locale={locale} icons={icons} values={profession.values} />
      </Card>
      <Card className="max-w-3xl">
        <DeleteProfessionForm id={id} locale={locale} />
      </Card>
    </>
  );
}
