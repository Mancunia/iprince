import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "./Brand";
import { HeaderShadow } from "./HeaderShadow";
import { LangSwitch } from "./LangSwitch";
import { MobileNav } from "./MobileNav";

export async function SiteHeader() {
  const t = await getTranslations("site");
  const links = [
    { href: "/#berufe", label: t("navProfessions") },
    { href: "/#ablauf", label: t("navSteps") },
    { href: "/employers", label: t("navEmployers") },
    { href: "/blog", label: t("navBlog") },
    { href: "/contact", label: t("navContact") },
  ];
  const cta = { href: "/#berufe", label: t("cta") };
  return (
    <header className="site-header">
      <HeaderShadow />
      <div className="site-header-inner container-page">
        <Link href="/" className="brand" aria-label={t("brand")}>
          <BrandLogo />
        </Link>
        <nav className="site-nav" aria-label={t("navLabel")}>
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="header-end">
          <LangSwitch />
          <Link href={cta.href} className="btn btn-primary header-cta">{cta.label}</Link>
          <MobileNav links={links} cta={cta} openLabel={t("menuOpen")} closeLabel={t("menuClose")} navLabel={t("navLabel")} />
        </div>
      </div>
    </header>
  );
}
