import { getChatProvider, getIntegrations } from "@/features/site-settings/queries";
import { resolveChatChannel } from "@/features/site-settings/settings";
import { TawkChat } from "./TawkChat";
import { WhatsAppButton } from "./WhatsAppButton";

/** The floating chat chosen under Admin → Settings: WhatsApp, tawk.to or nothing. */
export async function ChatChannel() {
  const channel = resolveChatChannel(await getChatProvider(), getIntegrations());
  if (channel.kind === "tawk") return <TawkChat propertyId={channel.propertyId} widgetId={channel.widgetId} />;
  if (channel.kind === "whatsapp") return <WhatsAppButton />;
  return null;
}
