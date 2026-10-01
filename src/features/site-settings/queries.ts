import "server-only";
import { cache } from "react";
import { readIntegrationsEnv, type Integrations } from "@/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { chatProviderInput, type ChatProvider } from "./settings";

/** The owner's chosen chat provider. Every public page reads it, so a failure logs and falls back to WhatsApp instead of breaking the site. */
export const getChatProvider = cache(async (): Promise<ChatProvider> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("site_settings").select("chat_provider").maybeSingle();
  if (error || !data) {
    console.error("read site_settings failed", error?.code ?? "no row");
    return "whatsapp";
  }
  return chatProviderInput.catch("whatsapp").parse(data.chat_provider);
});

/** Same fail-soft rule for a malformed embed ID: log it and leave the integrations off. */
export function getIntegrations(): Integrations {
  try {
    return readIntegrationsEnv();
  } catch (error) {
    console.error(error);
    return { cookieScriptId: null, tawk: null };
  }
}
