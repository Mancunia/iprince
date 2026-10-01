import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { StatusTabs } from "@/features/admin-shell/StatusTabs";
import { INBOX_LIMIT } from "@/features/applications/admin-queries";
import { listMessages } from "@/features/leads/admin-queries";
import { MESSAGE_STATUS_TONE } from "@/features/leads/inbox";
import { MESSAGE_STATUSES } from "@/features/leads/schema";
import { pickStatus } from "@/lib/status-param";
import { Avatar } from "@/ui/Avatar";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Status } from "@/ui/Status";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string | string[] }> };

export default async function MessagesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const status = pickStatus((await searchParams).status, MESSAGE_STATUSES);
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listMessages(status)]);

  return (
    <>
      <AdminPageHeader title={t("inbox.messagesTitle")} />
      <Card className="card-flush">
        <StatusTabs
          href="/admin/messages"
          current={status}
          statuses={MESSAGE_STATUSES}
          label={(s) => t(`inbox.messageStatuses.${s}`)}
          allLabel={t("allStatuses")}
          ariaLabel={t("statusFilter")}
        />
        {rows.length === 0 ? <EmptyState icon="mail" text={t("inbox.emptyMessages")} /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t("inbox.name")}</th>
                  <th scope="col">{t("inbox.message")}</th>
                  <th scope="col">{t("status")}</th>
                  <th scope="col">{t("inbox.received")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="name-cell">
                        <Avatar name={row.name} />
                        <Link href={`/admin/messages/${row.id}`} className="row-link">{row.name}</Link>
                      </div>
                    </td>
                    <td className="muted">{row.preview}</td>
                    <td><Status tone={MESSAGE_STATUS_TONE[row.status]}>{t(`inbox.messageStatuses.${row.status}`)}</Status></td>
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
