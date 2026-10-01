import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { acceptInvite } from "@/features/admin-auth/acceptInvite";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ token_hash?: string; next?: string }> };

// Outside (protected): the invitee has no session yet.
export default async function AcceptInvitePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, { token_hash, next }] = await Promise.all([getTranslations("admin.acceptInvite"), searchParams]);
  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("title")}</Text>
      <Text>{t("text")}</Text>
      <form action={acceptInvite}>
        <input type="hidden" name="token_hash" value={token_hash ?? ""} />
        <input type="hidden" name="next" value={next ?? ""} />
        <input type="hidden" name="locale" value={locale} />
        <Button type="submit">{t("submit")}</Button>
      </form>
    </Stack>
  );
}
