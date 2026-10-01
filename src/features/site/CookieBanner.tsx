"use client";

import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { showConsentBanner } from "./consent";

/** Loads the CookieScript banner and keeps its language in step with the site's locale. */
export function CookieBanner({ id }: { id: string }) {
  const locale = useLocale();
  useEffect(() => {
    const apply = () => window.CookieScript?.instance?.applyTranslationByCode(locale);
    apply();
    window.addEventListener("CookieScriptLoaded", apply);
    return () => window.removeEventListener("CookieScriptLoaded", apply);
  }, [locale]);
  return <Script id="cookiescript" src={`https://cdn.cookie-script.com/s/${id}.js`} strategy="afterInteractive" />;
}

/** Footer link that reopens the banner, so consent can be withdrawn as easily as it was given. */
export function CookieSettingsButton() {
  const t = useTranslations("site");
  return (
    <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-inherit underline" onClick={showConsentBanner}>
      {t("cookieSettings")}
    </button>
  );
}
