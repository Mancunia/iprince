import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { ContactForm } from "@/features/leads/ContactForm";
import { whatsappHref } from "@/features/site-content/content";
import { getSiteContent } from "@/features/site-content/queries";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tSite, { contact }] = await Promise.all([getTranslations("contact"), getTranslations("site"), getSiteContent()]);

  return (
    <section className="bg-accent-100/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:py-20">
        <div className="grid content-start gap-5">
          <p className="eyebrow">{t("kicker")}</p>
          <h1 className="text-3xl">{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
          <Card className="mt-4 items-start gap-4">
            <span className="icon-chip"><Icon name="message-circle" /></span>
            <h2 className="card-title">{t("whatsappTitle")}</h2>
            <p className="text-fg-muted">{t("whatsappText")}</p>
            <a href={whatsappHref(contact.whatsapp)} className="btn" target="_blank" rel="noopener noreferrer">
              <Icon name="message-circle" />
              {tSite("whatsapp")}: {contact.whatsapp}
            </a>
          </Card>
        </div>
        <Card className="p-6 shadow-raised md:p-10">
          <ContactForm />
        </Card>
      </div>
    </section>
  );
}
