import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { INBOX_LIMIT } from "@/features/applications/admin-queries";
import { listMessages } from "@/features/leads/admin-queries";
import { MESSAGE_STATUS_TONE } from "@/features/leads/inbox";
import { MESSAGE_STATUSES, type MessageStatus } from "@/features/leads/schema";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Status } from "@/ui/Status";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string }> };

export default async function MessagesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const { status: rawStatus } = await searchParams;
  const status = MESSAGE_STATUSES.includes(rawStatus as MessageStatus) ? (rawStatus as MessageStatus) : undefined;
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listMessages(status)]);

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("inbox.messagesTitle")}</Text>
      <form className="toolbar">
        <Select name="status" defaultValue={status ?? ""} aria-label={t("status")} dense className="w-auto min-w-48">
          <option value="">{t("allStatuses")}</option>
          {MESSAGE_STATUSES.map((s) => <option key={s} value={s}>{t(`inbox.messageStatuses.${s}`)}</option>)}
        </Select>
        <Button type="submit" variant="secondary" size="sm">{t("filter")}</Button>
      </form>
      {rows.length === 0 ? <Text tone="muted">{t("inbox.emptyMessages")}</Text> : (
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
                  <td><Link href={`/admin/messages/${row.id}`} className="row-link">{row.name}</Link></td>
                  <td className="muted">{row.preview}</td>
                  <td><Status tone={MESSAGE_STATUS_TONE[row.status]}>{t(`inbox.messageStatuses.${row.status}`)}</Status></td>
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
