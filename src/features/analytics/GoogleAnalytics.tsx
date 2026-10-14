"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useConsent } from "@/features/site/consent";

/** Queues commands on dataLayer until gtag.js loads (Google's standard bootstrap). Returns false if it already ran this page load. */
function bootstrapGtag(): boolean {
  if (window.gtag) return false;
  window.dataLayer ??= [];
  window.gtag = function gtag() {
    // gtag.js expects the arguments object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  return true;
}

/**
 * Google Analytics 4, loaded only after the visitor accepts CookieScript's "performance" category.
 * `config` sends the first page view; client navigations are counted by GA4's Enhanced Measurement
 * ("page changes based on browser history events", on by default), so no manual page_view here — that would double count.
 * GA4 always truncates IP addresses; ad features stay denied.
 */
export function GoogleAnalytics({ id }: { id: string }) {
  const consented = useConsent("performance");
  const started = useRef(false);

  useEffect(() => {
    if (consented) {
      started.current = true;
      if (bootstrapGtag()) {
        window.gtag!("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
        window.gtag!("js", new Date());
        window.gtag!("config", id);
      }
    } else if (started.current) {
      // Consent withdrawn: stop storage now; gtag.js cannot be unloaded, so reload into a page without it.
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      window.location.reload();
    }
  }, [consented, id]);

  // gtag.js stays loaded after this public-site component unmounts (e.g. a client navigation into /admin).
  // Google's opt-out flag stops every hit, including Enhanced Measurement clicks on signed file links, until we are back.
  useEffect(() => {
    window[`ga-disable-${id}`] = false;
    return () => {
      window[`ga-disable-${id}`] = true;
    };
  }, [id]);

  if (!consented) return null;
  return <Script id="ga4" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />;
}
