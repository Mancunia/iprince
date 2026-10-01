import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireAdmin, requireOwner } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { isLegalKey, isTextKey, keyFromSlug } from "@/features/site-content/content";
import { getContentMeta, getSiteContent } from "@/features/site-content/queries";
import { LegalForm } from "@/features/site-content/LegalForm";
import { ResetSectionForm } from "@/features/site-content/ResetSectionForm";
import { SECTION_FIELDS } from "@/features/site-content/sections";
import { SectionForm } from "@/features/site-content/SectionForm";
import { Card } from "@/ui/Card";

type Props = { params: Promise<{ locale: Locale; section: string }> };

export default async function ContentSectionPage({ params }: Props) {
  const { locale, section } = await params;
  setRequestLocale(locale);
  const key = keyFromSlug(section);
  if (!key) notFound();
  if (isLegalKey(key)) await requireOwner(locale);
  else await requireAdmin(locale);
  const [t, content, meta] = await Promise.all([getTranslations("admin.content"), getSiteContent(), getContentMeta()]);
  const back = { href: "/admin/content", label: t("title") };

  if (isTextKey(key)) {
    return (
      <>
        <AdminPageHeader title={t(`sections.${section}`)} back={back} actions={meta[key] ? <ResetSectionForm locale={locale} section={section} /> : null} />
        <Card className="max-w-4xl">
          <SectionForm locale={locale} section={section} groups={SECTION_FIELDS[key]} values={content[key]} />
        </Card>
      </>
    );
  }

  if (isLegalKey(key)) {
    return (
      <>
        <AdminPageHeader title={t(`sections.${section}`)} back={back} />
        <Card className="max-w-4xl">
          <LegalForm locale={locale} section={section} body={content[key].body} />
        </Card>
      </>
    );
  }

  // Photos (Task 9) are added below.
  notFound();
}
