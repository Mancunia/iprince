"use client";

import React, { useState, useEffect } from "react";
import { cmsService, DEFAULT_SITE_CONTENT } from "@/lib/services/cmsService";
import PricingEditor from "@/components/admin/PricingEditor";

export default function SiteContentAdminPage() {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [activeTab, setActiveTab] = useState<"hero" | "announcement" | "company" | "services" | "pricing">("hero");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setContent(cmsService.getSiteContent());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    cmsService.updateSiteContent(content);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Site Content & App Settings CMS
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Edit text, headlines, contact information, compliance accreditations, and announcement banners live on the platform.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-4 py-2 rounded-xl text-xs font-semibold animate-fade-in">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Changes successfully saved and applied!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-[#0B192C] p-1.5 rounded-2xl border border-[#1E293B]">
        <button
          type="button"
          onClick={() => setActiveTab("hero")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "hero"
              ? "bg-gold-500 text-navy-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Hero & Homepage Headlines
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("announcement")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "announcement"
              ? "bg-gold-500 text-navy-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Announcement Banner
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("company")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "company"
              ? "bg-gold-500 text-navy-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Company & Contact Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "services"
              ? "bg-gold-500 text-navy-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Services Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pricing")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "pricing"
              ? "bg-gold-500 text-navy-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Pricing & Services
        </button>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="bg-[#0B192C] border border-[#1E293B] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        {/* Tab 1: Hero Section */}
        {activeTab === "hero" && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-white border-b border-[#1E293B] pb-3">
              Hero Headlines & CTAs
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Hero Title (German / Deutsch)
                </label>
                <textarea
                  rows={2}
                  value={content.hero.title_de}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, title_de: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Hero Title (English)
                </label>
                <textarea
                  rows={2}
                  value={content.hero.title_en}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, title_en: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Hero Subtitle (German / Deutsch)
                </label>
                <textarea
                  rows={4}
                  value={content.hero.subtitle_de}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, subtitle_de: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Hero Subtitle (English)
                </label>
                <textarea
                  rows={4}
                  value={content.hero.subtitle_en}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, subtitle_en: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  CTA 1 Text (DE)
                </label>
                <input
                  type="text"
                  value={content.hero.findJobCta_de}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, findJobCta_de: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  CTA 1 Text (EN)
                </label>
                <input
                  type="text"
                  value={content.hero.findJobCta_en}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, findJobCta_en: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  CTA 2 Text (DE)
                </label>
                <input
                  type="text"
                  value={content.hero.findStaffCta_de}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, findStaffCta_de: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  CTA 2 Text (EN)
                </label>
                <input
                  type="text"
                  value={content.hero.findStaffCta_en}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, findStaffCta_en: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Announcement Bar */}
        {activeTab === "announcement" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Top Announcement Bar</h2>
                <p className="text-xs text-slate-400">Highlight active recruitment campaigns or visa updates</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.announcement.enabled}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      announcement: { ...content.announcement, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#070F1E] border border-[#1E293B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                <span className="ml-3 text-xs font-semibold text-slate-300">
                  {content.announcement.enabled ? "Active / Visible" : "Disabled / Hidden"}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Announcement Text (German / Deutsch)
                </label>
                <textarea
                  rows={2}
                  value={content.announcement.text_de}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      announcement: { ...content.announcement, text_de: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Announcement Text (English)
                </label>
                <textarea
                  rows={2}
                  value={content.announcement.text_en}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      announcement: { ...content.announcement, text_en: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target URL / Link Path
              </label>
              <input
                type="text"
                value={content.announcement.link}
                onChange={(e) =>
                  setContent({
                    ...content,
                    announcement: { ...content.announcement, link: e.target.value },
                  })
                }
                placeholder="/submit-cv or /for-employers"
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Company & Contact */}
        {activeTab === "company" && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-white border-b border-[#1E293B] pb-3">
              Company Headquarters & Legal Accreditations
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={content.company.name}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      company: { ...content.company, name: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Managing Director / Owner
                </label>
                <input
                  type="text"
                  value={content.company.owner}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      company: { ...content.company, owner: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Headquarters Address
                </label>
                <input
                  type="text"
                  value={content.company.address}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      company: { ...content.company, address: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Official Email
                </label>
                <input
                  type="email"
                  value={content.company.email}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      company: { ...content.company, email: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Phone Hotline
                </label>
                <input
                  type="text"
                  value={content.company.phone}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      company: { ...content.company, phone: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  WhatsApp Hotline Number
                </label>
                <input
                  type="text"
                  value={content.company.whatsapp}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      company: { ...content.company, whatsapp: e.target.value },
                    })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 pt-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400">
                Statutory Compliance Badges
              </h3>
              <input
                type="text"
                value={content.company.complianceBadge1}
                onChange={(e) =>
                  setContent({
                    ...content,
                    company: { ...content.company, complianceBadge1: e.target.value },
                  })
                }
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                value={content.company.complianceBadge2}
                onChange={(e) =>
                  setContent({
                    ...content,
                    company: { ...content.company, complianceBadge2: e.target.value },
                  })
                }
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                value={content.company.complianceBadge3}
                onChange={(e) =>
                  setContent({
                    ...content,
                    company: { ...content.company, complianceBadge3: e.target.value },
                  })
                }
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Services Overview */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-white border-b border-[#1E293B] pb-3">
              Featured Recruitment Services
            </h2>

            {content.services.map((svc, idx) => (
              <div
                key={svc.id}
                className="p-4 rounded-xl bg-[#070F1E] border border-[#1E293B] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gold-400 uppercase tracking-wider">
                    Service Pillar 0{idx + 1} ({svc.id})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Title (DE)</label>
                    <input
                      type="text"
                      value={svc.title_de}
                      onChange={(e) => {
                        const newSvcs = [...content.services];
                        newSvcs[idx].title_de = e.target.value;
                        setContent({ ...content, services: newSvcs });
                      }}
                      className="w-full bg-[#0B192C] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Title (EN)</label>
                    <input
                      type="text"
                      value={svc.title_en}
                      onChange={(e) => {
                        const newSvcs = [...content.services];
                        newSvcs[idx].title_en = e.target.value;
                        setContent({ ...content, services: newSvcs });
                      }}
                      className="w-full bg-[#0B192C] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Description (DE)</label>
                    <textarea
                      rows={2}
                      value={svc.description_de}
                      onChange={(e) => {
                        const newSvcs = [...content.services];
                        newSvcs[idx].description_de = e.target.value;
                        setContent({ ...content, services: newSvcs });
                      }}
                      className="w-full bg-[#0B192C] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Description (EN)</label>
                    <textarea
                      rows={2}
                      value={svc.description_en}
                      onChange={(e) => {
                        const newSvcs = [...content.services];
                        newSvcs[idx].description_en = e.target.value;
                        setContent({ ...content, services: newSvcs });
                      }}
                      className="w-full bg-[#0B192C] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Pricing */}
        {activeTab === "pricing" && (
          <PricingEditor
            value={content.pricing}
            onChange={(pricing) => setContent({ ...content, pricing })}
          />
        )}

        {/* Save Bar */}
        <div className="pt-4 border-t border-[#1E293B] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset all settings to default iPrince content?")) {
                setContent(DEFAULT_SITE_CONTENT);
                cmsService.updateSiteContent(DEFAULT_SITE_CONTENT);
              }
            }}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            Reset to Defaults
          </button>

          <button
            type="submit"
            className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg transition-all"
          >
            Save All Live Content
          </button>
        </div>
      </form>
    </div>
  );
}
