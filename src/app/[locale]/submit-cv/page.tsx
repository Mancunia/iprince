"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cmsService } from "@/lib/services/cmsService";

export default function SubmitCvPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isGerman = locale === "de";

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "Philippinen",
    profession: "Intensiv- & Anästhesiepflege (ITS)",
    languageLevel: "B2 Telc/Goethe",
    experienceYears: "3-5 Jahre",
    hasDefizitbescheid: "Ja, liegt bereits vor",
    resumeLink: "",
    notes: "",
    gdprConsent: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gdprConsent) {
      alert(
        isGerman
          ? "Bitte stimmen Sie der Datenschutzerklärung zu."
          : "Please agree to the privacy policy."
      );
      return;
    }

    setLoading(true);

    setTimeout(() => {
      cmsService.createSubmission({
        form_type: "candidate_cv",
        status: "new",
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        company_name: null,
        profession: formData.profession,
        language_level: formData.languageLevel,
        experience_years: formData.experienceYears,
        resume_url: formData.resumeLink || null,
        notes: formData.notes || null,
        form_payload: {
          country: formData.country,
          hasDefizitbescheid: formData.hasDefizitbescheid,
        },
        admin_notes: null,
      });

      setLoading(false);
      setSubmitted(true);
    }, 400);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-200 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-navy-900">
            {isGerman ? "Bewerbung erfolgreich eingereicht!" : "Application Submitted Successfully!"}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isGerman
              ? `Vielen Dank, ${formData.fullName}. Ihre Unterlagen sind direkt im iPrince Betreuungszentrum eingegangen. Unser Team wird Ihre Dokumente innerhalb von 24 Stunden prüfen.`
              : `Thank you, ${formData.fullName}. Your profile has been received by the iPrince candidate care team. We will review your qualifications within 24 hours.`}
          </p>

          <div className="p-4 rounded-2xl bg-gold-50 border border-gold-200 text-left space-y-2 text-xs text-navy-900">
            <p className="font-bold flex items-center gap-1.5 text-gold-800">
              <span>⚡ Fast-Track WhatsApp Express</span>
            </p>
            <p>
              {isGerman
                ? "Möchten Sie sofort mit Ihrem persönlichen Recruiter sprechen? Kontaktieren Sie uns direkt per WhatsApp."
                : "Would you like to connect immediately with your dedicated placement manager? Reach out via WhatsApp."}
            </p>
            <a
              href="https://wa.me/4917612345678"
              target="_blank"
              rel="noreferrer"
              className="inline-block font-bold text-emerald-600 hover:underline pt-1"
            >
              +49 176 1234 5678 (WhatsApp öffnen →)
            </a>
          </div>

          <div className="pt-2">
            <Link
              href={`/${locale}`}
              className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs inline-block transition-colors"
            >
              {isGerman ? "Zur Startseite" : "Back to Home"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <span>{isGerman ? "100% Kostenfreie Direktvermittlung" : "100% Free Placement Guarantee"}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-navy-900 tracking-tight">
            {isGerman ? "Bewerbung als Pflegefachkraft" : "Nursing Career Placement Application"}
          </h1>
          <p className="text-slate-600 text-sm">
            {isGerman
              ? "Starten Sie Ihre Karriere an einer deutschen Klinik mit beschleunigtem Visum (§ 81a)."
              : "Begin your journey to working in German premier clinics with expedited visa processing."}
          </p>
        </div>

        {/* Multi-Section Form Card adhering to Design System § 5.3 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3.5 mb-6">
              <span className="w-8 h-8 rounded-lg bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-xs">
                01
              </span>
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  {isGerman ? "Persönliche Kontaktdaten" : "Personal Information"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isGerman ? "Name und Erreichbarkeit für Ihre Betreuung" : "Contact details for your advisor"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Vollständiger Name" : "Full Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Maria Santos"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="maria.santos@example.com"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Telefon / WhatsApp" : "Phone / WhatsApp"} *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+63 917 ... oder +49 ..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Aktueller Wohnsitz (Land)" : "Current Country of Residence"}
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="z.B. Philippinen, Tunesien, Indien..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Qualifications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3.5 mb-6">
              <span className="w-8 h-8 rounded-lg bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-xs">
                02
              </span>
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  {isGerman ? "Klinische Qualifikation & Sprache" : "Clinical Qualifications & Language"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isGerman ? "Ihr Fachbereich und Sprachzertifikate" : "Your medical specialty and German level"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Fachbereich / Spezialisierung" : "Medical Specialty"} *
                </label>
                <select
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                >
                  <option value="Intensiv- & Anästhesiepflege (ITS)">Intensiv- & Anästhesiepflege (ITS)</option>
                  <option value="OP-Pflege & Chirurgische Assistenz">OP-Pflege & Chirurgie</option>
                  <option value="Allgemeine Krankenpflege (Stationär)">Allgemeine Krankenpflege</option>
                  <option value="Geriatrie & Altenpflege">Geriatrie & Altenpflege</option>
                  <option value="Pädiatrie & Kinderkrankenpflege">Pädiatrie</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Deutsch Sprachzertifikat" : "German Language Level"} *
                </label>
                <select
                  value={formData.languageLevel}
                  onChange={(e) => setFormData({ ...formData, languageLevel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                >
                  <option value="B2 Telc / Goethe bestanden">B2 Telc / Goethe (Bestanden)</option>
                  <option value="B1 bestanden (B2 in Vorbereitung)">B1 bestanden (B2 Vorbereitung)</option>
                  <option value="A2 Niveau">A2 Niveau</option>
                  <option value="C1 Medizin Fachsprache">C1 Medizin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Berufserfahrung in Kliniken" : "Years of Clinical Experience"}
                </label>
                <select
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                >
                  <option value="Unter 1 Jahr">Unter 1 Jahr</option>
                  <option value="1-2 Jahre">1-2 Jahre</option>
                  <option value="3-5 Jahre">3-5 Jahre</option>
                  <option value="Über 5 Jahre">Über 5 Jahre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Deutscher Anerkennungs- / Defizitbescheid" : "German Deficit Notice"}
                </label>
                <select
                  value={formData.hasDefizitbescheid}
                  onChange={(e) => setFormData({ ...formData, hasDefizitbescheid: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                >
                  <option value="Ja, liegt bereits vor">Ja, liegt bereits vor</option>
                  <option value="Bereits beantragt (in Bearbeitung)">Bereits beantragt (in Bearbeitung)</option>
                  <option value="Noch nicht beantragt">Noch nicht beantragt (Hilfe benötigt)</option>
                  <option value="Vollanerkennung erhalten">Vollanerkennung vorhanden</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: CV & Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3.5 mb-6">
              <span className="w-8 h-8 rounded-lg bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-xs">
                03
              </span>
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  {isGerman ? "Lebenslauf & Wünsche" : "Resume & Preferred Placement"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isGerman ? "Link zu Ihrem Lebenslauf oder Wünsche bezüglich Stadt/Klinik" : "Resume link or regional preferences"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Lebenslauf Link (Google Drive, Dropbox, LinkedIn, PDF)" : "Resume Link / Cloud Storage"}
                </label>
                <input
                  type="url"
                  value={formData.resumeLink}
                  onChange={(e) => setFormData({ ...formData, resumeLink: e.target.value })}
                  placeholder="https://drive.google.com/file/... oder LinkedIn URL"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Persönliche Notiz / Wunschregion in Deutschland" : "Notes & Preferences"}
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={
                    isGerman
                      ? "z.B. Ich bevorzuge Nordrhein-Westfalen oder Bayern, da ich dort Bekannte habe..."
                      : "e.g. Preferred hospital type, target start date, housing requirements..."
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.gdprConsent}
                    onChange={(e) => setFormData({ ...formData, gdprConsent: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 border-slate-300 focus:ring-navy-900 mt-0.5"
                  />
                  <span>
                    {isGerman
                      ? "Ich willige in die Speicherung meiner Daten zur Personalvermittlung gemäß DSGVO ein. Die Vermittlung ist für mich zu 100% kostenfrei."
                      : "I agree to the storage and processing of my application data under GDPR. Placement is 100% free of charge for candidates."}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-950 font-bold py-4 rounded-2xl shadow-xl transition-all text-sm disabled:opacity-50"
          >
            {loading
              ? isGerman
                ? "Wird übertragen..."
                : "Submitting Profile..."
              : isGerman
              ? "Bewerbung jetzt kostenlos absenden →"
              : "Submit Free Application Now →"}
          </button>
        </form>
      </div>
    </div>
  );
}
