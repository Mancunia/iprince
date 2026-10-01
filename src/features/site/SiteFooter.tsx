import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { whatsappHref } from "@/features/site-content/content";
import { getSiteContent } from "@/features/site-content/queries";
import { Icon } from "@/ui/Icon";
import { BrandLogo } from "./Brand";
import { CookieSettingsButton } from "./CookieBanner";

export async function SiteFooter({ cookieSettings }: { cookieSettings: boolean }) {
  const [t, { contact }] = await Promise.all([getTranslations("site"), getSiteContent()]);
  return (
    <footer className="site-footer">
      <div className="container-page">
        <div className="footer-cols">
          <div className="footer-col">
            <span className="brand">
              <BrandLogo />
            </span>
            <p className="max-w-[32ch] text-fg-muted">{t("tagline")}</p>
          </div>
          <div className="footer-col">
            <h4>{t("footerCandidates")}</h4>
            <Link href="/#berufe">{t("navProfessions")}</Link>
            <Link href="/#ablauf">{t("navSteps")}</Link>
          </div>
          <div className="footer-col">
            <h4>{t("footerEmployers")}</h4>
            <Link href="/employers">{t("footerEnquiry")}</Link>
            <Link href="/contact">{t("footerContactForm")}</Link>
          </div>
          <div className="footer-col">
            <h4>{t("footerContact")}</h4>
            <a href={whatsappHref(contact.whatsapp)} className="inline-flex items-center gap-2" target="_blank" rel="noopener noreferrer">
              <Icon name="message-circle" size={16} />
              {t("whatsapp")}: {contact.whatsapp}
            </a>
            {contact.email ? (
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2">
                <Icon name="mail" size={16} />
                {contact.email}
              </a>
            ) : null}
            {contact.address ? (
              <address className="inline-flex items-start gap-2 whitespace-pre-line not-italic">
                <Icon name="map-pin" size={16} className="mt-1" />
                {contact.address}
              </address>
            ) : null}
          </div>
        </div>
        <div className="footer-legal">
          <span>{t("rights", { year: new Date().getFullYear() })}</span>
          <nav aria-label={t("legalLabel")} className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/imprint">{t("imprint")}</Link>
            <Link href="/privacy">{t("privacy")}</Link>
            {cookieSettings ? <CookieSettingsButton /> : null}
          </nav>
        </div>
      </div>
    </footer>
  );
}
