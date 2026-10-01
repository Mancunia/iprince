import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { startFormDraft } from "@/features/forms/admin-actions";
import { getBuilderData } from "@/features/forms/admin-queries";
import { FormBuilder } from "@/features/forms/builder/FormBuilder";
import { FormPreview } from "@/features/forms/builder/FormPreview";
import { localized } from "@/lib/i18n/localized";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";

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
    <>
      <AdminPageHeader
        title={t("title", { name: localized(data.profession.name, locale) })}
        back={{ href: `/admin/professions/${id}`, label: t("backToProfession") }}
      />

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
        <>
          <Card className="items-start gap-4">
            <p className="text-fg-muted">{data.live ? t("liveVersion", { version: data.live.version }) : t("noForm")}</p>
            <form action={startFormDraft}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="professionId" value={id} />
              <Button type="submit">{t("startEditing")}</Button>
            </form>
          </Card>
          {data.live ? <Card><FormPreview definition={data.live.definition} initialLocale={locale} /></Card> : null}
        </>
      )}

      <Card>
        <h2 className="card-title">{t("history")}</h2>
        {data.versions.length === 0 ? <p className="muted">{t("noVersions")}</p> : (
          <ul className="grid gap-2">
            {data.versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link href={`/admin/professions/${id}/form?version=${v.version}`} className="font-semibold">{t("versionLabel", { version: v.version })}</Link>
                <span className="muted">{format.dateTime(new Date(v.publishedAt), { dateStyle: "medium", timeStyle: "short" })}</span>
                <span className="muted">{t("applicationCount", { count: v.applications })}</span>
                {v.id === data.live?.id ? <span className="status status-ok">{t("live")}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {viewing ? (
        <Card>
          <h3 className="card-title">{t("versionLabel", { version: viewing.version })}</h3>
          <FormPreview definition={viewing.definition} initialLocale={locale} />
        </Card>
      ) : null}
    </>
  );
}
