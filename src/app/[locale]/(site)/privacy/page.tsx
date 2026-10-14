import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { sitePageMetadata } from "@/features/seo/metadata";
import { LegalArticle } from "@/features/site-content/LegalArticle";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  return sitePageMetadata({ locale, path: "/privacy", title: t("privacy") });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site");
  return <LegalArticle contentKey="legal.privacy" locale={locale} title={t("privacy")} />;
}
