import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { getApplicationDetail } from "@/features/applications/admin-queries";
import { ReviewForm } from "@/features/applications/ReviewForm";
import { telHref } from "@/features/leads/inbox";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, tApply, format] = await Promise.all([getTranslations("admin"), getTranslations("apply"), getFormatter()]);
  const app = await getApplicationDetail(id, locale, { yes: tApply("yes"), no: tApply("no") });
  if (!app) notFound();

  return (
    <>
      <AdminPageHeader title={app.fullName} back={{ href: "/admin/applications", label: t("back") }} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <Card>
            <dl className="kv">
              <div><dt>{t("profession")}</dt><dd>{localized(app.professionName, locale)}</dd></div>
              <div><dt>{t("inbox.email")}</dt><dd><a href={`mailto:${app.email}`}>{app.email}</a></dd></div>
              <div><dt>{t("inbox.phone")}</dt><dd>{app.phone ? <a href={telHref(app.phone)}>{app.phone}</a> : "—"}</dd></div>
              <div>
                <dt>{t("submittedAt")}</dt>
                <dd>{format.dateTime(new Date(app.submittedAt), { dateStyle: "medium", timeStyle: "short" })} · {app.locale.toUpperCase()}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <h2 className="card-title">{t("answers")}</h2>
            <dl className="kv">
              {app.answers.map((a) => (
                <div key={a.key}><dt>{a.label}</dt><dd>{a.value}</dd></div>
              ))}
            </dl>
          </Card>
          <Card>
            <h2 className="card-title">{t("documents")}</h2>
            {app.files.length === 0 ? <p className="muted">—</p> : (
              <ul className="file-chips">
                {app.files.map((f) => (
                  <li key={f.path} className="grid gap-1">
                    <span className="text-xs text-fg-muted">{f.label}</span>
                    {f.url ? (
                      <a href={f.url} target="_blank" rel="noreferrer" className="file-chip">
                        <Icon name="file-text" size={16} />
                        {f.name}
                      </a>
                    ) : (
                      <span className="file-chip"><Icon name="file-text" size={16} />{f.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card className="xl:sticky xl:top-6">
          <h2 className="card-title">{t("review")}</h2>
          <ReviewForm id={app.id} locale={locale} status={app.status} adminNotes={app.adminNotes} />
        </Card>
      </div>
    </>
  );
}
