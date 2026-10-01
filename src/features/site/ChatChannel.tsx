import { getChatProvider, getIntegrations } from "@/features/site-settings/queries";
import { resolveChatChannel } from "@/features/site-settings/settings";
import { whatsappHref } from "@/features/site-content/content";
import { getSiteContent } from "@/features/site-content/queries";
import { TawkChat } from "./TawkChat";
import { WhatsAppButton } from "./WhatsAppButton";

/** The floating chat chosen under Admin → Settings: WhatsApp, tawk.to or nothing. */
export async function ChatChannel() {
  const channel = resolveChatChannel(await getChatProvider(), getIntegrations());
  if (channel.kind === "tawk") {
    const content = await getSiteContent();
    return <TawkChat propertyId={channel.propertyId} widgetId={channel.widgetId} whatsappUrl={whatsappHref(content.contact.whatsapp)} />;
  }
  if (channel.kind === "whatsapp") return <WhatsAppButton />;
  return null;
}
