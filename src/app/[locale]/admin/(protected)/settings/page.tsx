import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireOwner } from "@/features/admin-auth/session";
import { ChatSettingsForm } from "@/features/site-settings/ChatSettingsForm";
import { getChatProvider, getIntegrations } from "@/features/site-settings/queries";
import { tawkMissing } from "@/features/site-settings/settings";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function SettingsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireOwner(locale);
  const [t, current] = await Promise.all([getTranslations("admin.settings"), getChatProvider()]);
  const missing = tawkMissing(getIntegrations());

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("title")}</Text>
      {missing.length > 0 ? (
        <Text tone={current === "tawk" ? "danger" : "muted"}>
          {t("tawkNotReady", { missing: missing.map((m) => t(`missing.${m}`)).join(", ") })}
        </Text>
      ) : null}
      <ChatSettingsForm current={current} locale={locale} />
    </Stack>
  );
}
