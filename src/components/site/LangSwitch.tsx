"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/config";

export default function LangSwitch() {
  const t = useTranslations("site.header");
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <div className="lang-switch" role="group" aria-label={t("language")}>
      {locales.map((l) => (
        <Link key={l} href={pathname} locale={l} aria-current={l === locale ? "true" : undefined} lang={l}>
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
