"use client";

import { useLocale, useTranslations } from "next-intl";
import { locales } from "@/i18n/config";
import { Link, usePathname } from "@/i18n/navigation";

export function LangSwitch() {
  const t = useTranslations("site");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav className="lang-switch" aria-label={t("language")}>
      {locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          lang={locale}
          aria-label={t(`languages.${locale}`)}
          aria-current={locale === current ? "true" : undefined}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
