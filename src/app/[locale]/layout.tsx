import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import "../globals.css";

const barlow = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("site");

  return (
    <html lang={locale} className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        <NextIntlClientProvider>
          <a href="#main" className="skip-link">{t("skipLink")}</a>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
