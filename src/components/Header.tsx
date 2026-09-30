"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { locales } from "@/i18n/config";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Do not render public header in admin portal
  if (pathname?.includes("/admin")) {
    return null;
  }

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const navLinks = [
    { href: "/for-job-seekers", label: t("nav.forJobSeekers") },
    { href: "/for-employers", label: t("nav.forEmployers") },
    { href: "/jobs", label: t("nav.jobs") },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: t("nav.about") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="bg-navy-900 text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-gold-500">
            {t("common.logo")}
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-gold-500 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                    locale === loc
                      ? "bg-gold-500 text-navy-900"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {loc === "en" ? t("nav.switchToEnglish") : t("nav.switchToGerman")}
                </button>
              ))}
            </div>

            <Link
              href="/submit-cv"
              className="hidden sm:inline-block bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-2 px-4 rounded transition-colors"
            >
              {t("common.applyNow")}
            </Link>

            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 hover:text-gold-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/submit-cv"
              className="block mt-4 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-2 px-4 rounded text-center transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("common.applyNow")}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
