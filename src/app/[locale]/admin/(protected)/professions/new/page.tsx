import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { EMPTY_PROFESSION } from "@/features/professions/admin";
import { listIconNames } from "@/features/professions/admin-queries";
import { ProfessionForm } from "@/features/professions/ProfessionForm";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function NewProfessionPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, icons] = await Promise.all([getTranslations("admin.professions"), listIconNames()]);
  return (
    <Stack gap="lg">
      <Link href="/admin/professions">{t("back")}</Link>
      <Text as="h1" size="xl">{t("new")}</Text>
      <ProfessionForm mode="create" locale={locale} icons={icons} values={EMPTY_PROFESSION} />
    </Stack>
  );
}
