import { track as vercelTrack } from "@vercel/analytics";

export type AnalyticsEvent = "application_submitted" | "employer_enquiry_sent" | "contact_message_sent" | "chat_opened" | "post_shared";
export type ShareChannel = "native" | "copy" | "linkedin" | "facebook" | "x" | "xing" | "email";
export type EventProps = { profession?: string; channel?: "whatsapp" | "tawk" | ShareChannel };

const ALLOWED: (keyof EventProps)[] = ["profession", "channel"];

/**
 * Records a conversion. Vercel Web Analytics is cookieless and always receives it; GA4 only once the visitor
 * consented and gtag.js loaded (GoogleAnalytics.tsx). Only whitelisted props pass, so no personal data is sent.
 */
export function track(event: AnalyticsEvent, props: EventProps = {}): void {
  const safe = Object.fromEntries(ALLOWED.filter((key) => props[key] !== undefined).map((key) => [key, props[key]!]));
  vercelTrack(event, safe);
  if (typeof window !== "undefined") window.gtag?.("event", event, safe);
}
