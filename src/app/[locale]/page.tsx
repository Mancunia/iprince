import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { listActiveProfessions } from "@/features/professions/queries";
import { localized } from "@/lib/i18n/localized";
import { Icon } from "@/ui/Icon";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tMeta, professions] = await Promise.all([getTranslations("site"), getTranslations("metadata"), listActiveProfessions()]);

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{tMeta("title")}</Text>
      {professions.length === 0 ? <Text tone="muted">{t("noProfessions")}</Text> : null}
      <Stack as="ul" gap="sm">
        {professions.map((p) => (
          <li key={p.slug}>
            <Stack direction="row" gap="sm">
              <Icon name={p.icon} />
              <Text as="span" size="lg">{localized(p.name, locale)}</Text>
              <Text as="span" tone="muted">{t("openPositions", { count: p.openPositions })}</Text>
              <Link href={`/apply/${p.slug}`}>{t("apply")}</Link>
            </Stack>
          </li>
        ))}
      </Stack>
    </Stack>
  );
}
