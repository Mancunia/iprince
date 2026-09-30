import { useTranslations } from "next-intl";
import Icon from "./Icon";
import { site } from "@/lib/site";

export default function WhatsAppFab() {
  const t = useTranslations("site");
  return (
    <a className="wa-fab" href={site.whatsappHref} target="_blank" rel="noopener" aria-label={t("whatsappLabel")}>
      <Icon name="message-circle" />
      <span className="wa-label">WhatsApp</span>
    </a>
  );
}
