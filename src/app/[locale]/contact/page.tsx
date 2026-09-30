"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cmsService, DEFAULT_SITE_CONTENT } from "@/lib/services/cmsService";

export default function ContactPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isGerman = locale === "de";

  const [company, setCompany] = useState(DEFAULT_SITE_CONTENT.company);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "Erstberatung buchen (Allgemein)",
    message: "",
  });

  useEffect(() => {
    const data = cmsService.getSiteContent();
    setCompany(data.company);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      cmsService.createSubmission({
        form_type: "contact_inquiry",
        status: "new",
        full_name: formData.name,
        company_name: null,
        email: formData.email,
        phone: formData.phone || null,
        profession: null,
        language_level: null,
        experience_years: null,
        resume_url: null,
        notes: `Thema: ${formData.topic}\n\nNachricht: ${formData.message}`,
        form_payload: { topic: formData.topic },
        admin_notes: null,
      });

      setLoading(false);
      setSubmitted(true);
    }, 400);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Title */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900/5 text-navy-900 text-xs font-bold uppercase tracking-wider">
            <span>{isGerman ? "Erstberatung & Betreuung" : "Consultation & Support"}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-navy-900 tracking-tight">
            {isGerman ? "Kontaktieren Sie uns" : "Get in Touch with iPrince"}
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            {isGerman
              ? "Ob Fachkraft oder Klinikträger: Unser Führungsteam in Düsseldorf berät Sie diskret, kompetent und persönlich."
              : "Whether you are a healthcare professional or a hospital director, our leadership team in Düsseldorf is here for you."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Company Information Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#0B192C] text-white rounded-3xl p-8 shadow-xl border border-[#1E293B] space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gold-500 text-navy-950 font-black text-xl flex items-center justify-center mb-4">
                  ♛
                </div>
                <h2 className="text-xl font-bold text-white">{company.name}</h2>
                <p className="text-xs text-gold-400 font-medium mt-0.5">{company.owner}</p>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="text-gold-400 text-base">📍</span>
                  <div>
                    <span className="text-slate-400 block font-semibold">Hauptsitz:</span>
                    <span>{company.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-gold-400 text-base">📞</span>
                  <div>
                    <span className="text-slate-400 block font-semibold">Telefon Hotline:</span>
                    <a href={`tel:${company.phone}`} className="hover:text-gold-400 font-mono">
                      {company.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-gold-400 text-base">✉</span>
                  <div>
                    <span className="text-slate-400 block font-semibold">E-Mail:</span>
                    <a href={`mailto:${company.email}`} className="hover:text-gold-400 font-mono">
                      {company.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 text-base">💬</span>
                  <div>
                    <span className="text-slate-400 block font-semibold">WhatsApp Express:</span>
                    <a
                      href={`https://wa.me/${company.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline font-mono"
                    >
                      {company.whatsapp}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#1E293B] space-y-2 text-[11px] text-slate-400">
              <p>✓ {company.complianceBadge1}</p>
              <p>✓ {company.complianceBadge2}</p>
              <p>✓ {company.complianceBadge3}</p>
            </div>
          </div>

          {/* Form Card (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-navy-900">
                  {isGerman ? "Nachricht übermittelt!" : "Message Sent Successfully!"}
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {isGerman
                    ? "Vielen Dank für Ihre Anfrage. Ein Mitglied unseres Teams wird sich in Kürze bei Ihnen melden."
                    : "Thank you for reaching out. A specialist from our team will get back to you shortly."}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="bg-navy-900 text-white text-xs font-bold px-5 py-2 rounded-xl"
                >
                  {isGerman ? "Weitere Nachricht senden" : "Send Another Message"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-navy-900 mb-2">
                  {isGerman ? "Schreiben Sie uns eine Nachricht" : "Send Us a Message"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isGerman ? "Ihr Name *" : "Your Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Maria Santos"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isGerman ? "E-Mail-Adresse *" : "Email Address *"}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isGerman ? "Telefon / WhatsApp" : "Phone / WhatsApp"}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+49 ..."
                      className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isGerman ? "Anliegen / Thema" : "Inquiry Subject"}
                    </label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    >
                      <option value="Erstberatung Pflegekraft">Erstberatung als Fachkraft</option>
                      <option value="Personalbedarf Klinik">Personalbedarf Klinik / Heim</option>
                      <option value="Fragen zum Visum (§ 81a)">Fragen zum Visum (§ 81a)</option>
                      <option value="Kooperation & Partnerschaft">Kooperation & Partnerschaft</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isGerman ? "Ihre Nachricht *" : "Your Message *"}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={
                      isGerman
                        ? "Wie können wir Ihnen bei Ihrer Karriere oder Besetzung helfen?..."
                        : "How can we assist you with placement or clinic staffing?..."
                    }
                    className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-navy-900 hover:bg-navy-800 text-gold-400 font-bold py-3.5 rounded-xl shadow transition-colors text-xs disabled:opacity-50"
                >
                  {loading ? "Wird gesendet..." : isGerman ? "Nachricht jetzt absenden →" : "Send Message Now →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
