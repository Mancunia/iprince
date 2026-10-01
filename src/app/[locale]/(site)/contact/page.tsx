import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { ContactForm } from "@/features/leads/ContactForm";
import { WHATSAPP_NUMBER, WHATSAPP_URL } from "@/features/site/contact";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tSite] = await Promise.all([getTranslations("contact"), getTranslations("site")]);

  return (
    <div className="container-page grid gap-12 py-12 pb-24 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="grid content-start gap-8">
        <div className="grid gap-4">
          <p className="eyebrow">{t("kicker")}</p>
          <h1 className="text-3xl">{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
        </div>
        <Card className="form-section">
          <ContactForm />
        </Card>
      </div>
      <aside className="grid content-start gap-4 md:pt-24">
        <h2 className="text-xl">{t("whatsappTitle")}</h2>
        <p className="text-fg-muted">{t("whatsappText")}</p>
        <a href={WHATSAPP_URL} className="btn max-w-max" target="_blank" rel="noopener noreferrer">
          <Icon name="message-circle" />
          {tSite("whatsapp")}: {WHATSAPP_NUMBER}
        </a>
      </aside>
    </div>
  );
}
