import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { INBOX_LIMIT } from "@/features/applications/admin-queries";
import { listLeads } from "@/features/leads/admin-queries";
import { LEAD_STATUS_TONE } from "@/features/leads/inbox";
import { LEAD_STATUSES, type LeadStatus } from "@/features/leads/schema";
import { localized } from "@/lib/i18n/localized";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Status } from "@/ui/Status";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string }> };

export default async function LeadsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const { status: rawStatus } = await searchParams;
  const status = LEAD_STATUSES.includes(rawStatus as LeadStatus) ? (rawStatus as LeadStatus) : undefined;
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listLeads(status)]);

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("inbox.leadsTitle")}</Text>
      <form className="toolbar">
        <Select name="status" defaultValue={status ?? ""} aria-label={t("status")} dense className="w-auto min-w-48">
          <option value="">{t("allStatuses")}</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{t(`inbox.leadStatuses.${s}`)}</option>)}
        </Select>
        <Button type="submit" variant="secondary" size="sm">{t("filter")}</Button>
      </form>
      {rows.length === 0 ? <Text tone="muted">{t("inbox.emptyLeads")}</Text> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t("inbox.company")}</th>
                <th scope="col">{t("inbox.contactName")}</th>
                <th scope="col">{t("inbox.professions")}</th>
                <th scope="col">{t("status")}</th>
                <th scope="col">{t("inbox.received")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><Link href={`/admin/leads/${row.id}`} className="row-link">{row.company}</Link></td>
                  <td>{row.contactName}</td>
                  <td>{row.professionNames.map((n) => localized(n, locale)).join(", ") || "—"}</td>
                  <td><Status tone={LEAD_STATUS_TONE[row.status]}>{t(`inbox.leadStatuses.${row.status}`)}</Status></td>
                  <td className="nowrap muted">{format.dateTime(new Date(row.createdAt), { dateStyle: "medium", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === INBOX_LIMIT ? <Text tone="muted" size="sm">{t("inbox.limitNotice", { count: INBOX_LIMIT })}</Text> : null}
    </Stack>
  );
}
