import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { INBOX_LIMIT, listApplications } from "@/features/applications/admin-queries";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/features/applications/review";
import { localized } from "@/lib/i18n/localized";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string }> };

export default async function ApplicationsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const { status: rawStatus } = await searchParams;
  const status = APPLICATION_STATUSES.includes(rawStatus as ApplicationStatus) ? (rawStatus as ApplicationStatus) : undefined;
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listApplications(status)]);

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("applications")}</Text>
      <form>
        <Stack direction="row" gap="sm">
          <Select name="status" defaultValue={status ?? ""} aria-label={t("status")}>
            <option value="">{t("allStatuses")}</option>
            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
          </Select>
          <Button type="submit" variant="secondary">{t("filter")}</Button>
        </Stack>
      </form>
      {rows.length === 0 ? <Text tone="muted">{t("empty")}</Text> : null}
      {rows.length === INBOX_LIMIT ? <Text tone="muted" size="sm">{t("limitNotice", { count: INBOX_LIMIT })}</Text> : null}
      <Stack as="ul" gap="sm">
        {rows.map((row) => (
          <li key={row.id}>
            <Stack direction="row" gap="md">
              <Link href={`/admin/applications/${row.id}`}>{row.fullName}</Link>
              <Text as="span" tone="muted">{localized(row.professionName, locale)}</Text>
              <Text as="span">{t(`statuses.${row.status}`)}</Text>
              <Text as="span" tone="muted" size="sm">{format.dateTime(new Date(row.submittedAt), { dateStyle: "medium", timeStyle: "short" })}</Text>
            </Stack>
          </li>
        ))}
      </Stack>
    </Stack>
  );
}
