import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { startFormDraft } from "@/features/forms/admin-actions";
import { getBuilderData } from "@/features/forms/admin-queries";
import { FormBuilder } from "@/features/forms/builder/FormBuilder";
import { FormPreview } from "@/features/forms/builder/FormPreview";
import { localized } from "@/lib/i18n/localized";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale; id: string }>; searchParams: Promise<{ version?: string }> };

export default async function FormBuilderPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const { version } = await searchParams;
  const [t, format, data] = await Promise.all([getTranslations("admin.forms"), getFormatter(), getBuilderData(id)]);
  if (!data) notFound();
  const viewing = version ? data.versions.find((v) => String(v.version) === version) : undefined;

  return (
    <Stack gap="lg">
      <Link href={`/admin/professions/${id}`}>{t("backToProfession")}</Link>
      <Text as="h1" size="xl">{t("title", { name: localized(data.profession.name, locale) })}</Text>

      {data.draft ? (
        <FormBuilder
          key={data.draft.id}
          locale={locale}
          formId={data.draft.id}
          version={data.draft.version}
          initialDefinition={data.draft.definition}
          initialUpdatedAt={data.draft.updatedAt}
        />
      ) : (
        <Stack gap="md">
          <Text tone="muted">{data.live ? t("liveVersion", { version: data.live.version }) : t("noForm")}</Text>
          <form action={startFormDraft}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="professionId" value={id} />
            <Button type="submit">{t("startEditing")}</Button>
          </form>
          {data.live ? <FormPreview definition={data.live.definition} initialLocale={locale} /> : null}
        </Stack>
      )}

      <Text as="h2" size="lg">{t("history")}</Text>
      {data.versions.length === 0 ? <Text tone="muted">{t("noVersions")}</Text> : (
        <Stack as="ul" gap="xs">
          {data.versions.map((v) => (
            <li key={v.id}>
              <Link href={`/admin/professions/${id}/form?version=${v.version}`}>{t("versionLabel", { version: v.version })}</Link>
              {" · "}{format.dateTime(new Date(v.publishedAt), { dateStyle: "medium", timeStyle: "short" })}
              {" · "}{t("applicationCount", { count: v.applications })}
              {v.id === data.live?.id ? ` · ${t("live")}` : ""}
            </li>
          ))}
        </Stack>
      )}
      {viewing ? (
        <Stack gap="sm">
          <Text as="h3" size="lg">{t("versionLabel", { version: viewing.version })}</Text>
          <FormPreview definition={viewing.definition} initialLocale={locale} />
        </Stack>
      ) : null}
    </Stack>
  );
}
