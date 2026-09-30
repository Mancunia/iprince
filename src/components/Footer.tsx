"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cmsService, DEFAULT_SITE_CONTENT } from "@/lib/services/cmsService";

export default function Footer() {
  const t = useTranslations("footer");
  const pathname = usePathname();
  const [company, setCompany] = useState(DEFAULT_SITE_CONTENT.company);

  useEffect(() => {
    const data = cmsService.getSiteContent();
    setCompany(data.company);
  }, []);

  if (pathname?.includes("/admin")) {
    return null;
  }

  return (
    <footer className="bg-navy-950 text-white py-12 border-t border-navy-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-gold-500 mb-4">{company.name}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              {company.complianceBadge1}
            </p>
            <p className="text-xs text-gold-400">
              {company.complianceBadge2}
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-gold-400">{t("contact")}</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>{company.address}</li>
              <li>Tel: <a href={`tel:${company.phone}`} className="hover:text-gold-400">{company.phone}</a></li>
              <li>Email: <a href={`mailto:${company.email}`} className="hover:text-gold-400">{company.email}</a></li>
              <li>WhatsApp: <a href={`https://wa.me/${company.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">{company.whatsapp}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-gold-400">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/for-job-seekers" className="text-gray-300 hover:text-white transition-colors">Für Fachkräfte</Link></li>
              <li><Link href="/for-employers" className="text-gray-300 hover:text-white transition-colors">Für Arbeitgeber</Link></li>
              <li><Link href="/jobs" className="text-gray-300 hover:text-white transition-colors">Stellenangebote</Link></li>
              <li><Link href="/blog" className="text-gray-300 hover:text-white transition-colors">Karriere-Blog & Leitfäden</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Kontakt & Beratung</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-gold-400">Rechtliches & Admin</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/impressum" className="text-gray-300 hover:text-white transition-colors">{t("impressum")}</Link></li>
              <li><Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">{t("privacy")}</Link></li>
              <li><Link href="/cookie-policy" className="text-gray-300 hover:text-white transition-colors">{t("cookies")}</Link></li>
              <li className="pt-2 border-t border-navy-800">
                <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-gold-500 hover:text-gold-400 transition-colors font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Owner & Admin Portal
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">{t("social")}</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                LinkedIn
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Facebook
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-8 pt-8 text-center text-gray-400">
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
