import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";

export default function SiteFooter() {
  const t = useTranslations("site.footer");
  return (
    <footer className="site-footer" style={{ borderTop: "1px solid color-mix(in srgb, var(--color-paper) 20%, transparent)" }}>
      <div className="container">
        <div className="footer-cols">
          <div className="footer-col">
            <Image src="/logo/iprince-wordmark-light.png" alt="iPrince Personalvermittlung" width={729} height={248} style={{ height: 44, width: "auto" }} />
            <p style={{ color: "color-mix(in srgb, var(--color-paper) 78%, transparent)", maxWidth: "32ch" }}>{t("tagline")}</p>
          </div>
          <div className="footer-col">
            <h4>{t("candidates.title")}</h4>
            <Link href="/submit-cv">{t("candidates.apply")}</Link>
            <Link href="/jobs">{t("candidates.jobs")}</Link>
            <Link href="/#ablauf">{t("candidates.process")}</Link>
          </div>
          <div className="footer-col">
            <h4>{t("employers.title")}</h4>
            <Link href="/for-employers">{t("employers.request")}</Link>
            <Link href="/#arbeitgeber">{t("employers.services")}</Link>
            <Link href="/#kontakt">{t("employers.consult")}</Link>
          </div>
          <div className="footer-col">
            <h4>{t("contact.title")}</h4>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a href={site.whatsappHref}>WhatsApp: {site.phoneDisplay}</a>
          </div>
        </div>
        <div className="footer-legal">
          <span>© {new Date().getFullYear()} iPrince Personalvermittlung</span>
          <nav aria-label={t("legal.label")}>
            <a href="#">{t("legal.imprint")}</a>
            <a href="#">{t("legal.privacy")}</a>
            <a href="#">{t("legal.terms")}</a>
            <a href="#">{t("legal.cookies")}</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
