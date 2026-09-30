import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { LoginForm } from "@/features/admin-auth/LoginForm";
import { getAdminSession } from "@/features/admin-auth/session";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function AdminLoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getAdminSession()) redirect(`/${locale}/admin/applications`);
  const t = await getTranslations("admin");
  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("signInTitle")}</Text>
      <LoginForm locale={locale} />
    </Stack>
  );
}
