import { z } from "zod";
import type { Integrations } from "@/env";

export const chatProviders = ["whatsapp", "tawk", "none"] as const;
export type ChatProvider = (typeof chatProviders)[number];
export const chatProviderInput = z.enum(chatProviders);

export type ChatChannel = { kind: "whatsapp" } | { kind: "none" } | { kind: "tawk"; propertyId: string; widgetId: string };

/** What tawk.to still needs before it can run. It sets cookies, so it is never loaded without the consent banner. */
export function tawkMissing(integrations: Pick<Integrations, "cookieScriptId" | "tawk">): ("cookieScript" | "tawk")[] {
  return [...(integrations.cookieScriptId ? [] : ["cookieScript" as const]), ...(integrations.tawk ? [] : ["tawk" as const])];
}

/** The chat the public site shows. A half-configured tawk.to falls back to WhatsApp so visitors always have a way to reach us. */
export function resolveChatChannel(provider: ChatProvider, integrations: Pick<Integrations, "cookieScriptId" | "tawk">): ChatChannel {
  if (provider === "tawk" && integrations.tawk && tawkMissing(integrations).length === 0) {
    return { kind: "tawk", ...integrations.tawk };
  }
  return { kind: provider === "none" ? "none" : "whatsapp" };
}

/** GA4 sets cookies, so like tawk.to it only runs when the consent banner is configured too. */
export function gaEnabled(integrations: Pick<Integrations, "cookieScriptId" | "gaId">): integrations is { cookieScriptId: string; gaId: string } {
  return Boolean(integrations.cookieScriptId && integrations.gaId);
}
