import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { ApplyForm } from "@/features/applications/ApplyForm";
import { getApplyForm } from "@/features/professions/queries";
import { localized } from "@/lib/i18n/localized";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function ApplyPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const form = await getApplyForm(slug);
  if (!form) notFound();
  const t = await getTranslations("apply");

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("title", { profession: localized(form.name, locale) })}</Text>
      <ApplyForm professionSlug={form.slug} formId={form.formId} definition={form.definition} locale={locale} />
    </Stack>
  );
}
