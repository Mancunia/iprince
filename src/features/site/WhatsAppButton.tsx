import { getTranslations } from "next-intl/server";
import { whatsappHref } from "@/features/site-content/content";
import { getSiteContent } from "@/features/site-content/queries";
import { Icon } from "@/ui/Icon";

/** Floating WhatsApp button, bottom-right; icon-only below 720px. */
export async function WhatsAppButton() {
  const [t, content] = await Promise.all([getTranslations("site"), getSiteContent()]);
  return (
    <a
      href={whatsappHref(content.contact.whatsapp)}
      className="wa-fab"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("whatsappLabel", { number: content.contact.whatsapp })}
    >
      <Icon name="message-circle" />
      <span className="wa-label">{t("whatsapp")}</span>
    </a>
  );
}
