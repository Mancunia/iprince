import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { getMessage } from "@/features/leads/admin-queries";
import { DeleteEntryForm } from "@/features/leads/DeleteEntryForm";
import { MessageStatusForm } from "@/features/leads/MessageStatusForm";
import { Card } from "@/ui/Card";

export default async function MessageDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, format, message] = await Promise.all([getTranslations("admin"), getFormatter(), getMessage(id)]);
  if (!message) notFound();

  return (
    <>
      <AdminPageHeader title={message.name} back={{ href: "/admin/messages", label: t("inbox.backToMessages") }} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <dl className="kv">
            <div><dt>{t("inbox.email")}</dt><dd><a href={`mailto:${message.email}`}>{message.email}</a></dd></div>
            <div><dt>{t("inbox.received")}</dt><dd>{format.dateTime(new Date(message.createdAt), { dateStyle: "medium", timeStyle: "short" })}</dd></div>
          </dl>
          <h2 className="card-title pt-2">{t("inbox.message")}</h2>
          <p className="whitespace-pre-wrap">{message.message}</p>
        </Card>
        <div className="grid gap-6 xl:sticky xl:top-6">
          <Card>
            <h2 className="card-title">{t("review")}</h2>
            <MessageStatusForm id={message.id} locale={locale} status={message.status} />
          </Card>
          <Card>
            <h2 className="card-title">{t("dangerZone")}</h2>
            <DeleteEntryForm kind="message" id={message.id} locale={locale} />
          </Card>
        </div>
      </div>
    </>
  );
}
