import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "./Brand";
import { LangSwitch } from "./LangSwitch";

export async function SiteHeader() {
  const t = await getTranslations("site");
  return (
    <header className="site-header">
      <div className="site-header-inner container-page">
        <Link href="/" className="brand" aria-label={t("brand")}>
          <BrandLogo />
        </Link>
        <nav className="site-nav" aria-label={t("navLabel")}>
          <Link href="/#berufe">{t("navProfessions")}</Link>
          <Link href="/#ablauf">{t("navSteps")}</Link>
        </nav>
        <LangSwitch />
        <Link href="/#berufe" className="btn btn-primary header-cta">{t("cta")}</Link>
      </div>
    </header>
  );
}
