"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { useConsent } from "@/features/site/consent";

/** Queues commands on dataLayer until gtag.js loads (Google's standard bootstrap). */
function ensureGtag() {
  window.dataLayer ??= [];
  window.gtag ??= function gtag() {
    // gtag.js expects the arguments object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
}

/**
 * Google Analytics 4, loaded only after the visitor accepts CookieScript's "performance" category.
 * Page views are sent by hand because App Router navigations do not reload the page.
 * GA4 always truncates IP addresses; ad features stay denied.
 */
export function GoogleAnalytics({ id }: { id: string }) {
  const consented = useConsent("performance");
  const pathname = usePathname();
  const started = useRef(false);

  useEffect(() => {
    if (consented) {
      if (started.current) return;
      started.current = true;
      ensureGtag();
      window.gtag!("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      window.gtag!("js", new Date());
      window.gtag!("config", id, { send_page_view: false });
    } else if (started.current) {
      // Consent withdrawn: stop storage now; gtag.js cannot be unloaded, so reload into a page without it.
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      window.location.reload();
    }
  }, [consented, id]);

  useEffect(() => {
    if (consented) window.gtag?.("event", "page_view", { page_location: window.location.href });
  }, [consented, pathname]);

  if (!consented) return null;
  return <Script id="ga4" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />;
}
