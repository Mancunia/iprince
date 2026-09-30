import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { locales, type Locale } from "@/i18n/config";
import { color, space } from "@/ui/tokens.stylex";
import "../globals.css";

const styles = stylex.create({
  body: { backgroundColor: color.bg, color: color.text },
  main: { maxWidth: "960px", marginInline: "auto", padding: space.lg },
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
    <html lang={locale}>
      <body {...stylex.props(styles.body)}>
        <NextIntlClientProvider>
          <a href="#main">{t("skipLink")}</a>
          <main id="main" {...stylex.props(styles.main)}>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
