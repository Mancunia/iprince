"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/ui/Icon";
import { grantConsent, showConsentBanner, useConsent } from "./consent";
import { WHATSAPP_URL } from "./contact";

const SCRIPT_ID = "tawk-embed";

/** Injects the tawk.to embed once per page load. tawk.to keeps its widget in <body> across client navigations. */
function loadTawk(propertyId: string, widgetId: string, onLoad: () => void) {
  const api = (window.Tawk_API ??= {});
  api.onLoad = onLoad;
  if (document.getElementById(SCRIPT_ID)) return;
  window.Tawk_LoadStart = new Date();
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
  script.charset = "UTF-8";
  script.setAttribute("crossorigin", "*");
  document.body.appendChild(script);
}

/**
 * tawk.to live chat, loaded only after the visitor accepts CookieScript's "functionality" category.
 * Until then a chat button explains why and offers to enable it, with WhatsApp as a cookie-free alternative.
 */
export function TawkChat({ propertyId, widgetId }: { propertyId: string; widgetId: string }) {
  const t = useTranslations("site");
  const locale = useLocale();
  const consented = useConsent("functionality");
  const [open, setOpen] = useState(false);
  const [bannerMissing, setBannerMissing] = useState(false);
  const openAfterLoad = useRef(false);
  const panelId = useId();

  useEffect(() => {
    if (!consented) return;
    const ready = () => {
      const api = window.Tawk_API;
      api?.setAttributes?.({ language: locale }, () => {});
      api?.showWidget?.();
      if (openAfterLoad.current) {
        openAfterLoad.current = false;
        api?.maximize?.();
      }
    };
    loadTawk(propertyId, widgetId, ready);
    // Already loaded earlier in this page view (e.g. back from admin): onLoad will not fire again.
    if (window.Tawk_API?.showWidget) ready();
    // Leaving the public site or withdrawing consent hides the widget; the script cannot be unloaded without a reload.
    return () => window.Tawk_API?.hideWidget?.();
  }, [consented, propertyId, widgetId, locale]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // With consent, tawk.to renders its own launcher.
  if (consented) return null;

  const enable = () => {
    openAfterLoad.current = true;
    if (grantConsent("functionality")) setOpen(false);
    else setBannerMissing(true);
  };

  return (
    <>
      {open ? (
        <div id={panelId} role="region" aria-label={t("chat")} className="chat-consent">
          <p>{t("chatConsent")}</p>
          {bannerMissing ? <p role="alert" className="text-sm text-error">{t("chatUnavailable")}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={enable}>{t("chatEnable")}</button>
            <button type="button" className="btn btn-sm" onClick={showConsentBanner}>{t("cookieSettings")}</button>
          </div>
          <a href={WHATSAPP_URL} className="text-sm" target="_blank" rel="noopener noreferrer">{t("chatWhatsappInstead")}</a>
        </div>
      ) : null}
      <button
        type="button"
        className="wa-fab cursor-pointer"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("chatLabel")}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={open ? "x" : "message-circle"} />
        <span className="wa-label">{t("chat")}</span>
      </button>
    </>
  );
}
