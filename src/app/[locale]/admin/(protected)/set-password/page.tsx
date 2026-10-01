import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { SetPasswordForm } from "@/features/admin-auth/SetPasswordForm";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { Card } from "@/ui/Card";

// Inside (protected): an invited editor arrives here already signed in by /api/auth/confirm.
export default async function SetPasswordPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const t = await getTranslations("admin.setPassword");
  return (
    <>
      <AdminPageHeader title={t("title")} />
      <Card className="max-w-lg">
        <SetPasswordForm locale={locale} />
      </Card>
    </>
  );
}
