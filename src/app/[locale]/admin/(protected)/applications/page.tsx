import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { StatusTabs } from "@/features/admin-shell/StatusTabs";
import { INBOX_LIMIT, listApplications } from "@/features/applications/admin-queries";
import { APPLICATION_STATUSES, STATUS_TONE } from "@/features/applications/review";
import { localized } from "@/lib/i18n/localized";
import { pickStatus } from "@/lib/status-param";
import { Avatar } from "@/ui/Avatar";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Status } from "@/ui/Status";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string | string[] }> };

export default async function ApplicationsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const status = pickStatus((await searchParams).status, APPLICATION_STATUSES);
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listApplications(status)]);

  return (
    <>
      <AdminPageHeader title={t("applications")} />
      <Card className="card-flush">
        <StatusTabs
          href="/admin/applications"
          current={status}
          statuses={APPLICATION_STATUSES}
          label={(s) => t(`statuses.${s}`)}
          allLabel={t("allStatuses")}
          ariaLabel={t("statusFilter")}
        />
        {rows.length === 0 ? <EmptyState icon="inbox" text={t("empty")} /> : (
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
                    <td>
                      <div className="name-cell">
                        <Avatar name={row.fullName} />
                        <Link href={`/admin/applications/${row.id}`} className="row-link">{row.fullName}</Link>
                      </div>
                    </td>
                    <td>{localized(row.professionName, locale)}</td>
                    <td><Status tone={STATUS_TONE[row.status]}>{t(`statuses.${row.status}`)}</Status></td>
                    <td className="nowrap muted">{format.dateTime(new Date(row.submittedAt), { dateStyle: "medium", timeStyle: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {rows.length === INBOX_LIMIT ? <Text tone="muted" size="sm">{t("limitNotice", { count: INBOX_LIMIT })}</Text> : null}
    </>
  );
}
