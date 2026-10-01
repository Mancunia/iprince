import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { countDashboard } from "@/features/admin-dashboard/queries";
import { mergeRecent } from "@/features/admin-dashboard/recent";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { listApplications } from "@/features/applications/admin-queries";
import { STATUS_TONE } from "@/features/applications/review";
import { listLeads, listMessages } from "@/features/leads/admin-queries";
import { LEAD_STATUS_TONE, MESSAGE_STATUS_TONE } from "@/features/leads/inbox";
import { localized } from "@/lib/i18n/localized";
import { Avatar } from "@/ui/Avatar";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Icon } from "@/ui/Icon";
import { Status } from "@/ui/Status";

const RECENT = 5;

export default async function DashboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, format, counts, applications, leads, messages] = await Promise.all([
    getTranslations("admin"),
    getFormatter(),
    countDashboard(),
    listApplications(undefined, RECENT),
    listLeads(undefined, RECENT),
    listMessages(undefined, RECENT),
  ]);
  const inbox = mergeRecent(leads, messages, RECENT);
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" });
  const stats = [
    { href: { pathname: "/admin/applications", query: { status: "new" } }, icon: "inbox", value: counts.applications, label: t("dashboard.newApplications") },
    { href: { pathname: "/admin/leads", query: { status: "new" } }, icon: "building-2", value: counts.leads, label: t("dashboard.newLeads") },
    { href: { pathname: "/admin/messages", query: { status: "new" } }, icon: "mail", value: counts.messages, label: t("dashboard.newMessages") },
    { href: { pathname: "/admin/professions" }, icon: "briefcase", value: counts.activeProfessions, label: t("dashboard.activeProfessions") },
  ];

  return (
    <>
      <AdminPageHeader title={t("dashboard.title")} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card stat">
            <span className="icon-chip"><Icon name={s.icon} /></span>
            <span>
              <span className="stat-value">{format.number(s.value)}</span>
              <span className="stat-label">{s.label}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="card-flush">
          <div className="card-head min-h-17 px-6 py-3">
            <h2 className="card-title">{t("dashboard.latestApplications")}</h2>
            <Link href="/admin/applications" className="btn btn-ghost btn-sm">{t("dashboard.viewAll")}</Link>
          </div>
          {applications.length === 0 ? <EmptyState icon="inbox" text={t("empty")} /> : (
            <ul className="divide-y divide-hairline border-t border-hairline">
              {applications.map((a) => (
                <li key={a.id} className="relative flex items-center gap-3 px-6 py-3 hover:bg-canvas">
                  <Avatar name={a.fullName} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/applications/${a.id}`} className="row-link">{a.fullName}</Link>
                    <p className="cell-sub truncate">{localized(a.professionName, locale)} · {date(a.submittedAt)}</p>
                  </div>
                  <Status tone={STATUS_TONE[a.status]}>{t(`statuses.${a.status}`)}</Status>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="card-flush">
          <div className="card-head min-h-17 px-6 py-3">
            <h2 className="card-title">{t("dashboard.latestInbox")}</h2>
          </div>
          {inbox.length === 0 ? <EmptyState icon="mail" text={t("dashboard.emptyInbox")} /> : (
            <ul className="divide-y divide-hairline border-t border-hairline">
              {inbox.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="relative flex items-center gap-3 px-6 py-3 hover:bg-canvas">
                  <Avatar name={item.title} />
                  <div className="min-w-0 flex-1">
                    <Link href={item.kind === "lead" ? `/admin/leads/${item.id}` : `/admin/messages/${item.id}`} className="row-link">
                      {item.title}
                    </Link>
                    <p className="cell-sub truncate">
                      {item.kind === "lead" ? t("dashboard.kindLead") : t("dashboard.kindMessage")} · {date(item.createdAt)}
                    </p>
                  </div>
                  {item.kind === "lead" ? (
                    <Status tone={LEAD_STATUS_TONE[item.status]}>{t(`inbox.leadStatuses.${item.status}`)}</Status>
                  ) : (
                    <Status tone={MESSAGE_STATUS_TONE[item.status]}>{t(`inbox.messageStatuses.${item.status}`)}</Status>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
