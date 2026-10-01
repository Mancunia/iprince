import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import type { FormStatus } from "@/features/professions/admin";
import { listProfessionsForAdmin } from "@/features/professions/admin-queries";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Icon } from "@/ui/Icon";
import { Status, type StatusTone } from "@/ui/Status";

export default async function ProfessionsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, rows] = await Promise.all([getTranslations("admin.professions"), listProfessionsForAdmin()]);
  const statusText = (status: FormStatus) =>
    status.kind === "none" ? t("formStatus.none")
    : status.kind === "draft_only" ? t("formStatus.draftOnly")
    : t(status.draft ? "formStatus.liveWithDraft" : "formStatus.live", { version: status.version });
  const statusTone = (status: FormStatus): StatusTone =>
    status.kind === "none" ? "draft" : status.kind === "draft_only" ? "review" : "ok";
  const newLink = (
    <Link href="/admin/professions/new" className="btn btn-primary btn-sm">
      <Icon name="plus" size={16} />
      {t("new")}
    </Link>
  );

  return (
    <>
      <AdminPageHeader title={t("title")} actions={newLink} />
      {rows.length === 0 ? <Card><EmptyState icon="briefcase" text={t("empty")} /></Card> : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id} className="flex">
              <Card className="w-full gap-4">
                <div className="flex items-start gap-3">
                  <span className="icon-chip icon-chip-navy"><Icon name={row.icon} /></span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/professions/${row.id}`} className="card-title block text-fg no-underline hover:underline">
                      {localized(row.name, locale) || row.slug}
                    </Link>
                    <p className="cell-sub">{t("slug")}: {row.slug}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Status tone={row.isActive ? "ok" : "draft"}>{t("active")}: {row.isActive ? t("yes") : t("no")}</Status>
                  <Status tone={row.isFeatured ? "ok" : "draft"}>{t("featured")}: {row.isFeatured ? t("yes") : t("no")}</Status>
                </div>
                <p className="text-sm text-fg-muted">
                  {t("openPositions")}: {row.openPositions} · {t("sortOrder")}: {row.sortOrder}
                </p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-4">
                  <Status tone={statusTone(row.formStatus)}>{statusText(row.formStatus)}</Status>
                  <Link href={`/admin/professions/${row.id}/form`} className="btn btn-sm">{t("editForm")}</Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
