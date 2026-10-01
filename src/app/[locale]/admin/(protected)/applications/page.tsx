import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { INBOX_LIMIT, listApplications } from "@/features/applications/admin-queries";
import { APPLICATION_STATUSES, STATUS_TONE, type ApplicationStatus } from "@/features/applications/review";
import { localized } from "@/lib/i18n/localized";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Status } from "@/ui/Status";
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
      <form className="toolbar">
        <Select name="status" defaultValue={status ?? ""} aria-label={t("status")} dense className="w-auto min-w-48">
          <option value="">{t("allStatuses")}</option>
          {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
        </Select>
        <Button type="submit" variant="secondary" size="sm">{t("filter")}</Button>
      </form>
      {rows.length === 0 ? <Text tone="muted">{t("empty")}</Text> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t("applicant")}</th>
                <th scope="col">{t("profession")}</th>
                <th scope="col">{t("status")}</th>
                <th scope="col">{t("submittedAt")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><Link href={`/admin/applications/${row.id}`} className="row-link">{row.fullName}</Link></td>
                  <td>{localized(row.professionName, locale)}</td>
                  <td><Status tone={STATUS_TONE[row.status]}>{t(`statuses.${row.status}`)}</Status></td>
                  <td className="nowrap muted">{format.dateTime(new Date(row.submittedAt), { dateStyle: "medium", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === INBOX_LIMIT ? <Text tone="muted" size="sm">{t("limitNotice", { count: INBOX_LIMIT })}</Text> : null}
    </Stack>
  );
}
