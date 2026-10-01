import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { getLead } from "@/features/leads/admin-queries";
import { DeleteEntryForm } from "@/features/leads/DeleteEntryForm";
import { telHref } from "@/features/leads/inbox";
import { LeadReviewForm } from "@/features/leads/LeadReviewForm";
import { localized } from "@/lib/i18n/localized";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function LeadDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, format, lead] = await Promise.all([getTranslations("admin"), getFormatter(), getLead(id)]);
  if (!lead) notFound();
  const professions = lead.professionNames.map((n) => localized(n, locale)).join(", ");

  return (
    <Stack gap="lg">
      <Link href="/admin/leads">{t("inbox.backToLeads")}</Link>
      <Text as="h1" size="xl">{lead.company}</Text>
      <Text tone="muted">
        {t("inbox.received")} {format.dateTime(new Date(lead.createdAt), { dateStyle: "medium", timeStyle: "short" })}
      </Text>
      <dl className="spec">
        <div><dt>{t("inbox.contactName")}</dt><dd>{lead.contactName}</dd></div>
        <div><dt>{t("inbox.email")}</dt><dd><a href={`mailto:${lead.email}`}>{lead.email}</a></dd></div>
        <div><dt>{t("inbox.phone")}</dt><dd>{lead.phone ? <a href={telHref(lead.phone)}>{lead.phone}</a> : "—"}</dd></div>
        <div><dt>{t("inbox.headcount")}</dt><dd>{lead.headcount ?? "—"}</dd></div>
        <div><dt>{t("inbox.professions")}</dt><dd>{professions || "—"}</dd></div>
      </dl>
      {lead.message ? (
        <>
          <Text as="h2" size="lg">{t("inbox.message")}</Text>
          <p className="whitespace-pre-wrap">{lead.message}</p>
        </>
      ) : null}
      <LeadReviewForm id={lead.id} locale={locale} status={lead.status} adminNotes={lead.adminNotes} />
      <DeleteEntryForm kind="lead" id={lead.id} locale={locale} />
    </Stack>
  );
}
