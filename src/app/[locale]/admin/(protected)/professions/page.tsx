import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import type { FormStatus } from "@/features/professions/admin";
import { listProfessionsForAdmin } from "@/features/professions/admin-queries";
import { localized } from "@/lib/i18n/localized";
import { Stack } from "@/ui/Stack";
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

  return (
    <Stack gap="lg">
      <Stack direction="row" gap="md">
        <Text as="h1" size="xl">{t("title")}</Text>
        <Link href="/admin/professions/new">{t("new")}</Link>
      </Stack>
      {rows.length === 0 ? <Text tone="muted">{t("empty")}</Text> : (
        <table>
          <thead>
            <tr>
              <th scope="col">{t("name")}</th>
              <th scope="col">{t("slug")}</th>
              <th scope="col">{t("active")}</th>
              <th scope="col">{t("featured")}</th>
              <th scope="col">{t("openPositions")}</th>
              <th scope="col">{t("sortOrder")}</th>
              <th scope="col">{t("form")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/admin/professions/${row.id}`}>{localized(row.name, locale) || row.slug}</Link></td>
                <td>{row.slug}</td>
                <td>{row.isActive ? t("yes") : t("no")}</td>
                <td>{row.isFeatured ? t("yes") : t("no")}</td>
                <td>{row.openPositions}</td>
                <td>{row.sortOrder}</td>
                <td><Link href={`/admin/professions/${row.id}/form`}>{statusText(row.formStatus)}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Stack>
  );
}
