import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { LoginForm } from "@/features/admin-auth/LoginForm";
import { getAdminSession } from "@/features/admin-auth/session";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ notice?: string }> };

export default async function AdminLoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getAdminSession()) redirect(`/${locale}/admin/applications`);
  const [t, { notice }] = await Promise.all([getTranslations("admin"), searchParams]);
  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("signInTitle")}</Text>
      {notice === "invite_expired" ? <Text role="alert" tone="danger">{t("inviteExpired")}</Text> : null}
      <LoginForm locale={locale} />
    </Stack>
  );
}
