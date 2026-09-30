"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "./Icon";
import LangSwitch from "./LangSwitch";

const NAV = [
  { href: "/#fachkraefte", key: "candidates" },
  { href: "/#arbeitgeber", key: "employers" },
  { href: "/jobs", key: "jobs" },
  { href: "/#ablauf", key: "process" },
  { href: "/#faq", key: "faq" },
] as const;

export default function SiteHeader() {
  const t = useTranslations("site.header");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link className="brand" href="/" aria-label={t("homeLabel")}>
          <Image className="brand-mark logo-dark" src="/logo/iprince-mark.png" alt="" width={556} height={478} priority />
          <Image className="brand-mark logo-light" src="/logo/iprince-mark-light.png" alt="" width={556} height={478} />
          <Image className="brand-word logo-dark" src="/logo/iprince-wordmark.png" alt="iPrince Personalvermittlung" width={729} height={248} priority />
          <Image className="brand-word logo-light" src="/logo/iprince-wordmark-light.png" alt="iPrince Personalvermittlung" width={729} height={248} />
        </Link>
        <nav className="site-nav" aria-label={t("mainNav")}>
          {NAV.map((n) => (
            <Link key={n.key} href={n.href}>
              {t(`nav.${n.key}`)}
            </Link>
          ))}
        </nav>
        <LangSwitch />
        <Link className="btn btn-primary btn-sm header-cta" href="/for-employers">
          {t("cta")}
        </Link>
        <button
          type="button"
          className="btn btn-icon menu-btn"
          aria-label={open ? t("closeMenu") : t("openMenu")}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? "x" : "menu"} />
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" className="container mobile-nav" aria-label={t("mainNav")}>
          {NAV.map((n) => (
            <Link key={n.key} href={n.href} onClick={close}>
              {t(`nav.${n.key}`)}
            </Link>
          ))}
          <Link className="btn btn-primary" href="/for-employers" onClick={close}>
            {t("cta")}
          </Link>
        </nav>
      )}
    </header>
  );
}
