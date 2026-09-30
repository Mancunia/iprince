import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { getApplicationDetail } from "@/features/applications/admin-queries";
import { ReviewForm } from "@/features/applications/ReviewForm";
import { localized } from "@/lib/i18n/localized";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, tApply, format] = await Promise.all([getTranslations("admin"), getTranslations("apply"), getFormatter()]);
  const app = await getApplicationDetail(id, locale, { yes: tApply("yes"), no: tApply("no") });
  if (!app) notFound();

  return (
    <Stack gap="lg">
      <Link href="/admin/applications">{t("back")}</Link>
      <Text as="h1" size="xl">{app.fullName}</Text>
      <Text tone="muted">
        {localized(app.professionName, locale)} · {app.email}
        {app.phone ? ` · ${app.phone}` : ""} · {app.locale.toUpperCase()} · {t("submittedAt")}{" "}
        {format.dateTime(new Date(app.submittedAt), { dateStyle: "medium", timeStyle: "short" })}
      </Text>

      <Text as="h2" size="lg">{t("answers")}</Text>
      <dl>
        {app.answers.map((a) => (
          <div key={a.key}>
            <dt><strong>{a.label}</strong></dt>
            <dd>{a.value}</dd>
          </div>
        ))}
      </dl>

      <Text as="h2" size="lg">{t("documents")}</Text>
      <Stack as="ul" gap="xs">
        {app.files.map((f) => (
          <li key={f.path}>
            {f.label}: {f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a> : f.name}
          </li>
        ))}
      </Stack>

      <ReviewForm id={app.id} locale={locale} status={app.status} adminNotes={app.adminNotes} />
    </Stack>
  );
}
