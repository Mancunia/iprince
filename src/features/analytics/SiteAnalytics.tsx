"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";
import { useEffect } from "react";
import { track } from "./track";

// Admin pages are never tracked. The component only renders in the (site) layout; this also covers its script after a client navigation into /admin.
const skipAdmin: BeforeSend = (event) => (new URL(event.url).pathname.split("/")[2] === "admin" ? null : event);

/** Cookieless Vercel Web Analytics for the public site, plus the WhatsApp conversion for every wa.me link on the page. */
export function SiteAnalytics() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href^='https://wa.me/']") : null;
      if (link) track("chat_opened", { channel: "whatsapp" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return <Analytics beforeSend={skipAdmin} />;
}
