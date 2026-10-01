import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import type { FormStatus } from "@/features/professions/admin";
import { listProfessionsForAdmin } from "@/features/professions/admin-queries";
import { localized } from "@/lib/i18n/localized";
import { Stack } from "@/ui/Stack";
import { Status, type StatusTone } from "@/ui/Status";
import { Text } from "@/ui/Text";

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
  const yesNo = (value: boolean) => <Status tone={value ? "ok" : "draft"}>{value ? t("yes") : t("no")}</Status>;

  return (
    <Stack gap="lg">
      <Stack direction="row" gap="md" className="justify-between">
        <Text as="h1" size="xl">{t("title")}</Text>
        <Link href="/admin/professions/new" className="btn btn-primary btn-sm">{t("new")}</Link>
      </Stack>
      {rows.length === 0 ? <Text tone="muted">{t("empty")}</Text> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t("name")}</th>
                <th scope="col">{t("active")}</th>
                <th scope="col">{t("featured")}</th>
                <th scope="col" className="num">{t("openPositions")}</th>
                <th scope="col" className="num">{t("sortOrder")}</th>
                <th scope="col">{t("form")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/admin/professions/${row.id}`} className="row-link">{localized(row.name, locale) || row.slug}</Link>
                    <div className="cell-sub">{t("slug")}: {row.slug}</div>
                  </td>
                  <td>{yesNo(row.isActive)}</td>
                  <td>{yesNo(row.isFeatured)}</td>
                  <td className="num">{row.openPositions}</td>
                  <td className="num">{row.sortOrder}</td>
                  <td>
                    <Link href={`/admin/professions/${row.id}/form`} className="no-underline hover:underline">
                      <Status tone={statusTone(row.formStatus)}>{statusText(row.formStatus)}</Status>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Stack>
  );
}
