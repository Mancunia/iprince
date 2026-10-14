import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { ApplyForm } from "@/features/applications/ApplyForm";
import { getApplyForm } from "@/features/professions/queries";
import { sitePageMetadata } from "@/features/seo/metadata";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const form = await getApplyForm(slug);
  if (!form) return {};
  const t = await getTranslations({ locale, namespace: "apply" });
  return sitePageMetadata({ locale, path: `/apply/${form.slug}`, title: t("title", { profession: localized(form.name, locale) }), description: t("lead") });
}

export default async function ApplyPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const form = await getApplyForm(slug);
  if (!form) notFound();
  const t = await getTranslations("apply");

  return (
    <div className="bg-accent-100/60">
      <div className="container-form grid gap-6 py-10 pb-24">
        <Link href="/#berufe" className="btn btn-ghost btn-sm -ml-3 max-w-max">
          <Icon name="arrow-left" size={16} />
          {t("back")}
        </Link>
        <Card className="gap-4 p-6 md:p-8">
          <span className="icon-chip icon-chip-navy icon-chip-lg"><Icon name={form.icon} size={28} /></span>
          <p className="eyebrow">{t("kicker")}</p>
          <h1 className="text-3xl">{t("title", { profession: localized(form.name, locale) })}</h1>
          <p className="lead">{t("lead")}</p>
        </Card>
        <Card className="p-6 md:p-10">
          <ApplyForm professionSlug={form.slug} formId={form.formId} definition={form.definition} locale={locale} />
        </Card>
      </div>
    </div>
  );
}
