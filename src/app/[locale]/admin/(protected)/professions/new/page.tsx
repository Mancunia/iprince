import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { EMPTY_PROFESSION } from "@/features/professions/admin";
import { listIconNames } from "@/features/professions/admin-queries";
import { ProfessionForm } from "@/features/professions/ProfessionForm";
import { Card } from "@/ui/Card";

export default async function NewProfessionPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, icons] = await Promise.all([getTranslations("admin.professions"), listIconNames()]);
  return (
    <>
      <AdminPageHeader title={t("new")} back={{ href: "/admin/professions", label: t("back") }} />
      <Card className="max-w-3xl">
        <ProfessionForm mode="create" locale={locale} icons={icons} values={EMPTY_PROFESSION} />
      </Card>
    </>
  );
}
