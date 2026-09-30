"use client";

import React, { useState, useEffect } from "react";
import { cmsService } from "@/lib/services/cmsService";
import type { FormSubmissionRow } from "@/lib/supabase/database.types";

export default function FormSubmissionsPage() {
  const [submissions, setSubmissions] = useState<FormSubmissionRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionRow | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const loadData = () => {
    const list = cmsService.getSubmissions({
      type: typeFilter,
      status: statusFilter,
      search: search.trim() || undefined,
    });
    setSubmissions(list);

    // Keep selectedSubmission updated if open
    if (selectedSubmission) {
      const refreshed = list.find((s) => s.id === selectedSubmission.id);
      if (refreshed) setSelectedSubmission(refreshed);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter, search]);

  const handleOpenDrawer = (sub: FormSubmissionRow) => {
    setSelectedSubmission(sub);
    setAdminNoteInput(sub.admin_notes || "");
    setNoteSaved(false);

    // If it was "new", automatically move to "under_review" on open so the unread counter updates
    if (sub.status === "new") {
      const updated = cmsService.updateSubmissionStatus(sub.id, "under_review");
      if (updated) setSelectedSubmission(updated);
      loadData();
    }
  };

  const handleStatusChange = (id: string, newStatus: FormSubmissionRow["status"]) => {
    cmsService.updateSubmissionStatus(id, newStatus);
    loadData();
  };

  const handleSaveNotes = () => {
    if (!selectedSubmission) return;
    cmsService.updateSubmissionStatus(
      selectedSubmission.id,
      selectedSubmission.status,
      adminNoteInput
    );
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
    loadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete submission from ${name}?`)) {
      cmsService.deleteSubmission(id);
      setSelectedSubmission(null);
      loadData();
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Type", "Status", "Full Name", "Email", "Phone", "Company", "Profession", "German Level", "Date"];
    const rows = submissions.map((s) => [
      s.id,
      s.form_type,
      s.status,
      `"${s.full_name}"`,
      s.email,
      `"${s.phone || ""}"`,
      `"${s.company_name || ""}"`,
      `"${s.profession || ""}"`,
      `"${s.language_level || ""}"`,
      s.created_at,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `iprince_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Customer Form Submissions Inbox
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Review international nurse job applications, clinic hiring requests, and contact inquiries.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-semibold px-4 py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Form Type Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-[#070F1E] p-1 rounded-xl border border-[#1E293B] w-full lg:w-auto">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === "all" ? "bg-gold-500 text-navy-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            All Submissions
          </button>
          <button
            onClick={() => setTypeFilter("candidate_cv")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === "candidate_cv" ? "bg-gold-500 text-navy-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Candidate CVs
          </button>
          <button
            onClick={() => setTypeFilter("employer_request")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === "employer_request" ? "bg-gold-500 text-navy-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Clinic Staff Requests
          </button>
          <button
            onClick={() => setTypeFilter("contact_inquiry")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === "contact_inquiry" ? "bg-gold-500 text-navy-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Inquiries
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
            <svg className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#070F1E] border border-[#1E293B] text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-gold-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New / Unread</option>
            <option value="under_review">Under Review</option>
            <option value="contacted">Contacted</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        {submissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📬</div>
            <h3 className="text-base font-bold text-white mb-1">No form submissions found</h3>
            <p className="text-xs text-slate-400">
              When applicants submit their CVs or clinics submit hiring requests, they will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E293B]">
            {submissions.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenDrawer(item)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      item.form_type === "candidate_cv"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : item.form_type === "employer_request"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {item.form_type === "candidate_cv"
                      ? "CV"
                      : item.form_type === "employer_request"
                      ? "HQ"
                      : "MSG"}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{item.full_name}</span>
                      {item.company_name && (
                        <span className="text-xs text-gold-400 font-medium">
                          ({item.company_name})
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.status === "new"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                            : item.status === "contacted"
                            ? "bg-blue-500/20 text-blue-400"
                            : item.status === "under_review"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      {item.profession && (
                        <span className="text-slate-200 font-medium">{item.profession}</span>
                      )}
                      {item.language_level && (
                        <>
                          <span>•</span>
                          <span className="text-gold-400/90">{item.language_level}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{item.email}</span>
                      {item.phone && (
                        <>
                          <span>•</span>
                          <span>{item.phone}</span>
                        </>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-1.5 italic">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                  <span className="text-[11px] text-slate-500">
                    {new Date(item.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-xs text-gold-400 font-semibold bg-white/5 px-2.5 py-1 rounded-lg">
                    Open Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-over Drawer: Submission Details */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-[#0B192C] border-l border-[#1E293B] w-full max-w-xl h-full overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl flex flex-col justify-between animate-slide-in">
            <div className="space-y-6">
              {/* Drawer Top */}
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-400/10 px-2.5 py-1 rounded-md border border-gold-400/20">
                    {selectedSubmission.form_type === "candidate_cv"
                      ? "Candidate CV"
                      : selectedSubmission.form_type === "employer_request"
                      ? "Hospital Request"
                      : "General Inquiry"}
                  </span>
                  <span className="text-xs text-slate-400">Ref: {selectedSubmission.id}</span>
                </div>

                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  ✕
                </button>
              </div>

              {/* Status Bar */}
              <div className="bg-[#070F1E] border border-[#1E293B] p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400">Current Processing Status</p>
                  <p className="text-sm font-bold text-white capitalize">{selectedSubmission.status}</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedSubmission.status}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedSubmission.id,
                        e.target.value as FormSubmissionRow["status"]
                      )
                    }
                    className="bg-[#0B192C] border border-gold-500/40 text-gold-400 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none"
                  >
                    <option value="new">New</option>
                    <option value="under_review">Under Review</option>
                    <option value="contacted">Contacted</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Contact Information & One-Click Actions */}
              <div className="bg-[#070F1E] border border-[#1E293B] p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400">
                  Contact & Direct Communication
                </h3>

                <div>
                  <h2 className="text-xl font-bold text-white">{selectedSubmission.full_name}</h2>
                  {selectedSubmission.company_name && (
                    <p className="text-sm text-gold-400 font-medium">
                      {selectedSubmission.company_name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Email Address:</span>
                    <a
                      href={`mailto:${selectedSubmission.email}`}
                      className="text-gold-400 hover:underline font-mono"
                    >
                      {selectedSubmission.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone / WhatsApp:</span>
                    <span className="font-mono">{selectedSubmission.phone || "Not provided"}</span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1E293B]">
                  {selectedSubmission.phone && (
                    <a
                      href={`https://wa.me/${selectedSubmission.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Hallo ${selectedSubmission.full_name}, hier ist Prince I. von iPrince Personalvermittlung bezüglich Ihrer Bewerbung.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition-colors"
                    >
                      <span>💬 Open WhatsApp Chat</span>
                    </a>
                  )}

                  <a
                    href={`mailto:${selectedSubmission.email}?subject=${encodeURIComponent(
                      "Ihre Anfrage bei iPrince Personalvermittlung"
                    )}`}
                    className="bg-white/10 hover:bg-white/15 text-white font-semibold text-xs px-4 py-2 rounded-xl border border-white/10 transition-colors"
                  >
                    ✉ Send Email
                  </a>

                  {selectedSubmission.resume_url && (
                    <a
                      href={selectedSubmission.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/40 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                      📄 Download CV / Resume
                    </a>
                  )}
                </div>
              </div>

              {/* Application Details */}
              <div className="bg-[#070F1E] border border-[#1E293B] p-5 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400">
                  Profile & Application Data
                </h3>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Specialty / Profession:</span>
                    <span className="text-white font-semibold">
                      {selectedSubmission.profession || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">German Language Level:</span>
                    <span className="text-gold-400 font-semibold">
                      {selectedSubmission.language_level || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Experience:</span>
                    <span className="text-white font-semibold">
                      {selectedSubmission.experience_years || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Submitted At:</span>
                    <span className="text-slate-300">
                      {new Date(selectedSubmission.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedSubmission.notes && (
                  <div className="pt-2 border-t border-[#1E293B]">
                    <span className="text-slate-500 text-xs block mb-1">Customer Note / Message:</span>
                    <p className="text-xs text-slate-200 leading-relaxed bg-[#0B192C] p-3 rounded-xl border border-[#1E293B]">
                      {selectedSubmission.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Internal Owner Notes */}
              <div className="bg-[#070F1E] border border-[#1E293B] p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400">
                    Internal Owner Notes
                  </h3>
                  {noteSaved && (
                    <span className="text-[11px] text-emerald-400 font-medium">✓ Note saved!</span>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Add private notes about interview dates, hospital matches, visa progress..."
                  className="w-full bg-[#0B192C] border border-[#1E293B] focus:border-gold-500 rounded-xl p-3 text-xs text-white outline-none"
                />

                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-white/10"
                >
                  Save Internal Note
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-[#1E293B] flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  handleDelete(selectedSubmission.id, selectedSubmission.full_name)
                }
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Delete Submission
              </button>

              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold px-5 py-2 rounded-xl text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
