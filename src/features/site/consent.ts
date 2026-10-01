"use client";

import { useSyncExternalStore } from "react";

// Fired on window by CookieScript once it is ready and whenever the visitor makes or changes a choice.
const EVENTS = ["CookieScriptLoaded", "CookieScriptAccept", "CookieScriptAcceptAll", "CookieScriptReject"] as const;

/** True only after an explicit accept that includes the category; before any choice nothing is consented. */
export function hasConsent(state: ReturnType<CookieScriptInstance["currentState"]> | undefined, category: CookieScriptCategory): boolean {
  return state?.action === "accept" && (state.categories ?? []).includes(category);
}

function subscribe(onChange: () => void) {
  for (const event of EVENTS) window.addEventListener(event, onChange);
  return () => {
    for (const event of EVENTS) window.removeEventListener(event, onChange);
  };
}

/** Whether the visitor consented to a CookieScript category; re-renders when they change their choice. */
export function useConsent(category: CookieScriptCategory): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hasConsent(window.CookieScript?.instance?.currentState(), category),
    () => false,
  );
}

/** Adds one category to whatever the visitor already accepted. Returns false while the banner script is unavailable (e.g. blocked). */
export function grantConsent(category: CookieScriptCategory): boolean {
  const instance = window.CookieScript?.instance;
  if (!instance) return false;
  const state = instance.currentState();
  const current = state.action === "accept" ? (state.categories ?? []) : [];
  instance.acceptAction([...new Set([...current, category])]);
  return true;
}

/** Reopens the banner so visitors can review or withdraw consent. */
export function showConsentBanner(): void {
  window.CookieScript?.instance?.show();
}
