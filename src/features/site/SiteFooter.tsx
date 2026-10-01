import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/ui/Icon";
import { BrandLogo } from "./Brand";
import { CookieSettingsButton } from "./CookieBanner";
import { WHATSAPP_NUMBER, WHATSAPP_URL } from "./contact";

export async function SiteFooter({ cookieSettings }: { cookieSettings: boolean }) {
  const t = await getTranslations("site");
  return (
    <footer className="site-footer">
      <div className="container-page">
        <div className="footer-cols">
          <div className="footer-col">
            <span className="brand">
              <BrandLogo />
            </span>
            <p className="max-w-[32ch] text-fg-inverse/80">{t("tagline")}</p>
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
            <a href={WHATSAPP_URL} className="inline-flex items-center gap-2" target="_blank" rel="noopener noreferrer">
              <Icon name="message-circle" size={16} />
              {t("whatsapp")}: {WHATSAPP_NUMBER}
            </a>
          </div>
        </div>
        <div className="footer-legal">
          <span>{t("rights", { year: new Date().getFullYear() })}</span>
          {cookieSettings ? <nav aria-label={t("legalLabel")}><CookieSettingsButton /></nav> : null}
        </div>
      </div>
    </footer>
  );
}
