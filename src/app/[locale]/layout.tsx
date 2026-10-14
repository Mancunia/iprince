import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DM_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { getIntegrations } from "@/features/site-settings/queries";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";
import "../globals.css";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const { googleVerification } = getIntegrations();
  return {
    metadataBase: siteUrl(),
    title: { template: `%s · ${t("title")}`, default: t("title") },
    description: t("description"),
    applicationName: t("title"),
    icons: { icon: DEFAULT_OG_IMAGE, apple: DEFAULT_OG_IMAGE },
    openGraph: { siteName: t("title"), images: [{ url: DEFAULT_OG_IMAGE }] },
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("site");

  return (
    <html lang={locale} className={dmSans.variable}>
      <body>
        <NextIntlClientProvider>
          <a href="#main" className="skip-link">{t("skipLink")}</a>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
