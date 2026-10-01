import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { getProfessionForAdmin, listIconNames } from "@/features/professions/admin-queries";
import { DeleteProfessionForm } from "@/features/professions/DeleteProfessionForm";
import { ProfessionForm } from "@/features/professions/ProfessionForm";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function EditProfessionPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, icons, profession] = await Promise.all([getTranslations("admin.professions"), listIconNames(), getProfessionForAdmin(id)]);
  if (!profession) notFound();

  return (
    <Stack gap="lg">
      <Link href="/admin/professions">{t("back")}</Link>
      <Stack direction="row" gap="md">
        <Text as="h1" size="xl">{profession.values.nameDe}</Text>
        <Link href={`/admin/professions/${id}/form`}>{t("editForm")}</Link>
      </Stack>
      <ProfessionForm mode="edit" id={id} locale={locale} icons={icons} values={profession.values} />
      <DeleteProfessionForm id={id} locale={locale} />
    </Stack>
  );
}
