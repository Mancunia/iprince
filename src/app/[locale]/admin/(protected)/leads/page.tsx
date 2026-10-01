import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { StatusTabs } from "@/features/admin-shell/StatusTabs";
import { INBOX_LIMIT } from "@/features/applications/admin-queries";
import { listLeads } from "@/features/leads/admin-queries";
import { LEAD_STATUS_TONE } from "@/features/leads/inbox";
import { LEAD_STATUSES } from "@/features/leads/schema";
import { localized } from "@/lib/i18n/localized";
import { pickStatus } from "@/lib/status-param";
import { Avatar } from "@/ui/Avatar";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Status } from "@/ui/Status";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string | string[] }> };

export default async function LeadsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const status = pickStatus((await searchParams).status, LEAD_STATUSES);
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listLeads(status)]);

  return (
    <>
      <AdminPageHeader title={t("inbox.leadsTitle")} />
      <Card className="card-flush">
        <StatusTabs
          href="/admin/leads"
          current={status}
          statuses={LEAD_STATUSES}
          label={(s) => t(`inbox.leadStatuses.${s}`)}
          allLabel={t("allStatuses")}
          ariaLabel={t("statusFilter")}
        />
        {rows.length === 0 ? <EmptyState icon="building-2" text={t("inbox.emptyLeads")} /> : (
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
                    <td>
                      <div className="name-cell">
                        <Avatar name={row.company} />
                        <Link href={`/admin/leads/${row.id}`} className="row-link">{row.company}</Link>
                      </div>
                    </td>
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
      </Card>
      {rows.length === INBOX_LIMIT ? <Text tone="muted" size="sm">{t("inbox.limitNotice", { count: INBOX_LIMIT })}</Text> : null}
    </>
  );
}
