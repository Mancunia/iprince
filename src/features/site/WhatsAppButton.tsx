import { getTranslations } from "next-intl/server";
import { Icon } from "@/ui/Icon";
import { WHATSAPP_URL } from "./contact";

/** Floating WhatsApp button, bottom-right; icon-only below 720px. */
export async function WhatsAppButton() {
  const t = await getTranslations("site");
  return (
    <a href={WHATSAPP_URL} className="wa-fab" target="_blank" rel="noopener noreferrer" aria-label={t("whatsappLabel")}>
      <Icon name="message-circle" />
      <span className="wa-label">{t("whatsapp")}</span>
    </a>
  );
}
