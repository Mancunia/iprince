"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cmsService } from "@/lib/services/cmsService";

export default function ForEmployersPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isGerman = locale === "de";

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    clinicName: "",
    contactPerson: "",
    email: "",
    phone: "",
    department: "Zentral-OP / Anästhesie",
    numberOfPositions: 4,
    housingProvided: "Ja, Klinikwohnheim vorhanden",
    urgency: "Schnellstmöglich (über § 81a Fast-Track)",
    notes: "",
    gdprConsent: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gdprConsent) {
      alert("Bitte bestätigen Sie die DSGVO-Einwilligung.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      cmsService.createSubmission({
        form_type: "employer_request",
        status: "new",
        full_name: formData.contactPerson,
        company_name: formData.clinicName,
        email: formData.email,
        phone: formData.phone || null,
        profession: formData.department,
        language_level: "B2 Telc / Pflege",
        experience_years: "Examiniert mit Berufserfahrung",
        resume_url: null,
        notes: formData.notes || `Bedarf: ${formData.numberOfPositions} Fachkräfte. Wohnraum: ${formData.housingProvided}. Dringlichkeit: ${formData.urgency}.`,
        form_payload: {
          department: formData.department,
          numberOfPositions: formData.numberOfPositions,
          housingProvided: formData.housingProvided,
          urgency: formData.urgency,
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
          <div className="w-16 h-16 rounded-full bg-navy-900 text-gold-400 flex items-center justify-center mx-auto text-2xl font-bold">
            ♛
          </div>
          <h2 className="text-2xl font-bold text-navy-900">
            {isGerman ? "Bedarfsanfrage erfolgreich übermittelt" : "Staffing Request Transmitted"}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isGerman
              ? `Sehr geehrte(r) ${formData.contactPerson}, vielen Dank für Ihr Vertrauen in iPrince Personalvermittlung. Unsere Geschäftsführung wird sich innerhalb von 12 Stunden persönlich mit Ihnen in Verbindung setzen.`
              : `Dear ${formData.contactPerson}, thank you for your staffing request. Our executive management will contact you directly within 12 hours.`}
          </p>
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
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header Title */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-bold uppercase tracking-wider shadow">
            <span>{isGerman ? "Für Kliniken & Pflegeheime" : "For Hospitals & Healthcare Groups"}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-navy-900 tracking-tight">
            {isGerman ? "Qualifiziertes Pflegepersonal anfordern" : "Request Certified Nursing Personnel"}
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            {isGerman
              ? "Rechtssicher, auditkonform und in Rekordzeit über das beschleunigte Fachkräfteverfahren (§ 81a AufenthG)."
              : "Audit-ready, certified international nurses with accelerated visa timelines and dedicated integration."}
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3.5 mb-2">
              <span className="w-8 h-8 rounded-lg bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-xs">
                01
              </span>
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  {isGerman ? "Einrichtung & Ansprechpartner" : "Healthcare Facility Details"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isGerman ? "Klinikname und Kontaktdaten der Pflegedirektion / HR" : "Hospital name and management contact"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Name der Klinik / Träger *" : "Clinic / Hospital Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.clinicName}
                  onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                  placeholder="z.B. Klinikum Düsseldorf gGmbH"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Ansprechpartner (Name & Position) *" : "Contact Person (Name & Title) *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="z.B. Dr. Markus Weber, Pflegedirektor"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Geschäftliche E-Mail *" : "Business Email *"}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="weber@klinikum-beispiel.de"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Telefonnummer / Durchwahl *" : "Direct Phone Hotline *"}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+49 (0) 211 ..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3.5 mb-2">
              <span className="w-8 h-8 rounded-lg bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-xs">
                02
              </span>
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  {isGerman ? "Personalbedarf & Rahmenbedingungen" : "Staffing Demands & Terms"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isGerman ? "Benötigte Fachkräfte, Stationen und Einsatzfristen" : "Required wards, numbers, and deadlines"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Gesuchte Station / Fachabteilung" : "Department / Ward"}
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                >
                  <option value="Intensivstation (ITS) / Weaning">Intensivstation (ITS) / Weaning</option>
                  <option value="Zentral-OP / Anästhesie">Zentral-OP / Anästhesie</option>
                  <option value="Allgemeinchirurgie & Innere Medizin">Allgemeinchirurgie & Innere</option>
                  <option value="Geriatrische Frührehabilitation">Geriatrie & Pflegeheim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Anzahl gesuchter Pflegekräfte" : "Number of Nurses Needed"}
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.numberOfPositions}
                  onChange={(e) => setFormData({ ...formData, numberOfPositions: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Verfügbarkeit von Personalwohnungen" : "Staff Housing Available?"}
                </label>
                <select
                  value={formData.housingProvided}
                  onChange={(e) => setFormData({ ...formData, housingProvided: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                >
                  <option value="Ja, Klinikwohnungen vorhanden">Ja, Klinikwohnungen vorhanden</option>
                  <option value="Unterstützung durch iPrince Relocation gewünscht">Unterstützung durch iPrince gewünscht</option>
                  <option value="Eigene Zimmer / Appartements für 6 Monate">Eigene Appartements für 6 Monate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isGerman ? "Gewünschte Einsatzaufnahme" : "Desired Start Date / Urgency"}
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-navy-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                >
                  <option value="Schnellstmöglich (§ 81a Fast-Track)">Schnellstmöglich (§ 81a Fast-Track)</option>
                  <option value="In den nächsten 3-4 Monaten">In den nächsten 3-4 Monaten</option>
                  <option value="Nächstes Quartal">Nächstes Quartal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isGerman ? "Besondere Anforderungen oder Mitteilung" : "Special Requirements"}
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={
                  isGerman
                    ? "z.B. Erfahrung mit ECMO oder Beatmung erwünscht..."
                    : "e.g. ECMO experience, specific language nuances, shift schedules..."
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
                    ? "Ich willige in die DSGVO-konforme Kontaktaufnahme zur Personalvermittlung ein."
                    : "I consent to GDPR-compliant contact regarding staffing services."}
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-900 hover:bg-navy-800 text-gold-400 font-bold py-4 rounded-2xl shadow-xl transition-all text-sm disabled:opacity-50"
          >
            {loading ? "Wird übermittelt..." : isGerman ? "Personalbedarf jetzt unverbindlich anfordern →" : "Request Qualified Personnel Now →"}
          </button>
        </form>
      </div>
    </div>
  );
}
