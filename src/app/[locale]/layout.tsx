import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import LegalStrip from "@/components/site/LegalStrip";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import WhatsAppFab from "@/components/site/WhatsAppFab";
import "../globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await props.params;
  const messages = await getMessages({ locale });
  const metadata = messages.metadata?.home;

  return {
    title: metadata?.title,
    description: metadata?.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations("site");

  return (
    <html lang={locale} className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <a className="skip-link" href="#main">
            {t("skipLink")}
          </a>
          <LegalStrip />
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <WhatsAppFab />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
