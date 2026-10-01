import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { getLead } from "@/features/leads/admin-queries";
import { DeleteEntryForm } from "@/features/leads/DeleteEntryForm";
import { telHref } from "@/features/leads/inbox";
import { LeadReviewForm } from "@/features/leads/LeadReviewForm";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";

export default async function LeadDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, format, lead] = await Promise.all([getTranslations("admin"), getFormatter(), getLead(id)]);
  if (!lead) notFound();
  const professions = lead.professionNames.map((n) => localized(n, locale)).join(", ");

  return (
    <>
      <AdminPageHeader title={lead.company} back={{ href: "/admin/leads", label: t("inbox.backToLeads") }} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <Card>
            <dl className="kv">
              <div><dt>{t("inbox.contactName")}</dt><dd>{lead.contactName}</dd></div>
              <div><dt>{t("inbox.email")}</dt><dd><a href={`mailto:${lead.email}`}>{lead.email}</a></dd></div>
              <div><dt>{t("inbox.phone")}</dt><dd>{lead.phone ? <a href={telHref(lead.phone)}>{lead.phone}</a> : "—"}</dd></div>
              <div><dt>{t("inbox.headcount")}</dt><dd>{lead.headcount ?? "—"}</dd></div>
              <div><dt>{t("inbox.professions")}</dt><dd>{professions || "—"}</dd></div>
              <div><dt>{t("inbox.received")}</dt><dd>{format.dateTime(new Date(lead.createdAt), { dateStyle: "medium", timeStyle: "short" })}</dd></div>
            </dl>
          </Card>
          {lead.message ? (
            <Card>
              <h2 className="card-title">{t("inbox.message")}</h2>
              <p className="whitespace-pre-wrap">{lead.message}</p>
            </Card>
          ) : null}
        </div>
        <div className="grid gap-6 xl:sticky xl:top-6">
          <Card>
            <h2 className="card-title">{t("review")}</h2>
            <LeadReviewForm id={lead.id} locale={locale} status={lead.status} adminNotes={lead.adminNotes} />
          </Card>
          <Card>
            <h2 className="card-title">{t("dangerZone")}</h2>
            <DeleteEntryForm kind="lead" id={lead.id} locale={locale} />
          </Card>
        </div>
      </div>
    </>
  );
}
