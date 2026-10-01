import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/features/admin-auth/actions";
import { requireAdmin } from "@/features/admin-auth/session";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) notFound();
  const admin = await requireAdmin(locale);
  const t = await getTranslations("admin");

  return (
    <Stack gap="lg">
      <Stack as="header" direction="row" gap="md">
        <Stack as="nav" direction="row" gap="md">
          <Link href="/admin/applications">{t("applications")}</Link>
          <Link href="/admin/professions">{t("navProfessions")}</Link>
          {admin.role === "owner" ? <Link href="/admin/team">{t("navTeam")}</Link> : null}
        </Stack>
        <Text as="span" tone="muted" size="sm">{admin.displayName}</Text>
        <form action={signOut}>
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" variant="secondary">{t("signOut")}</Button>
        </form>
      </Stack>
      {children}
    </Stack>
  );
}
