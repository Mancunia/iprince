"use client";

import React, { useState, useEffect } from "react";
import { cmsService } from "@/lib/services/cmsService";
import type { ReviewRow } from "@/lib/supabase/database.types";

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingReview, setEditingReview] = useState<Partial<ReviewRow> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    const list = cmsService.getReviews({
      status: statusFilter === "all" ? undefined : statusFilter,
    });
    setReviews(list);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    setEditingReview({
      author_name: "",
      role_title: "Pflegefachkraft (ITS / Anästhesie)",
      clinic_name: "Universitätsklinikum Düsseldorf",
      rating: 5,
      review_text_de: "",
      review_text_en: "",
      verified: true,
      is_featured: false,
      status: "approved",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rev: ReviewRow) => {
    setEditingReview(rev);
    setIsModalOpen(true);
  };

  const handleStatusToggle = (id: string, newStatus: ReviewRow["status"]) => {
    cmsService.updateReview(id, { status: newStatus });
    loadData();
  };

  const handleFeaturedToggle = (id: string, current: boolean) => {
    cmsService.updateReview(id, { is_featured: !current });
    loadData();
  };

  const handleDelete = (id: string, author: string) => {
    if (confirm(`Delete testimonial from ${author}?`)) {
      cmsService.deleteReview(id);
      loadData();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview?.author_name || !editingReview?.review_text_de) return;

    if (editingReview.id) {
      cmsService.updateReview(editingReview.id, editingReview);
    } else {
      cmsService.createReview({
        author_name: editingReview.author_name,
        role_title: editingReview.role_title || "Pflegefachkraft",
        clinic_name: editingReview.clinic_name || null,
        author_avatar: editingReview.author_avatar || null,
        rating: editingReview.rating || 5,
        review_text_de: editingReview.review_text_de,
        review_text_en: editingReview.review_text_en || null,
        verified: editingReview.verified ?? true,
        is_featured: editingReview.is_featured ?? false,
        status: editingReview.status || "approved",
      });
    }

    setIsModalOpen(false);
    setEditingReview(null);
    loadData();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Customer Reviews & Testimonials
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Moderate, approve, and showcase feedback from placed nurses and German clinic directors.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
        >
          <span>+ Add Review Manually</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl p-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5 bg-[#070F1E] p-1 rounded-xl border border-[#1E293B]">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "all" ? "bg-gold-500 text-navy-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "pending" ? "bg-gold-500 text-navy-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "approved" ? "bg-gold-500 text-navy-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "rejected" ? "bg-gold-500 text-navy-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-[#0B192C] border border-[#1E293B] hover:border-gold-500/30 rounded-2xl p-6 transition-all shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1 text-amber-400 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < rev.rating ? "text-amber-400" : "text-slate-600"}>
                      ★
                    </span>
                  ))}
                  <span className="text-xs font-bold text-slate-300 ml-1.5">{rev.rating}.0</span>
                </div>

                <div className="flex items-center gap-2">
                  {rev.is_featured && (
                    <span className="text-[10px] font-bold bg-gold-500/20 text-gold-400 border border-gold-500/30 px-2 py-0.5 rounded-md">
                      Featured on Home
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      rev.status === "approved"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : rev.status === "pending"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed italic bg-[#070F1E] p-3.5 rounded-xl border border-[#1E293B] mb-3">
                &ldquo;{rev.review_text_de}&rdquo;
              </p>

              {rev.review_text_en && (
                <p className="text-[11px] text-slate-400 leading-relaxed italic mb-3">
                  EN: &ldquo;{rev.review_text_en}&rdquo;
                </p>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  {rev.author_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{rev.author_name}</span>
                    {rev.verified && (
                      <span className="text-emerald-400 text-xs" title="Verified Placement">
                        ✓
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {rev.role_title} {rev.clinic_name ? `• ${rev.clinic_name}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1E293B]">
              <div className="flex items-center gap-2">
                {rev.status !== "approved" ? (
                  <button
                    onClick={() => handleStatusToggle(rev.id, "approved")}
                    className="text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusToggle(rev.id, "pending")}
                    className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1.5 rounded-lg"
                  >
                    Set Pending
                  </button>
                )}

                <button
                  onClick={() => handleFeaturedToggle(rev.id, rev.is_featured)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    rev.is_featured
                      ? "border-gold-500/40 text-gold-400 bg-gold-500/10"
                      : "border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {rev.is_featured ? "★ Featured" : "☆ Feature"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(rev)}
                  className="text-xs text-slate-400 hover:text-white p-1.5 rounded hover:bg-white/5"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(rev.id, rev.author_name)}
                  className="text-xs text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create / Edit Review */}
      {isModalOpen && editingReview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h2 className="text-base font-bold text-white">
                {editingReview.id ? "Edit Review" : "Add Customer Review"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Author Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingReview.author_name || ""}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, author_name: e.target.value })
                    }
                    placeholder="e.g. Liezel Fernandez"
                    className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Role / Medical Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingReview.role_title || ""}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, role_title: e.target.value })
                    }
                    placeholder="e.g. Intensivfachkraft (ITS)"
                    className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Hospital / Clinic Name
                  </label>
                  <input
                    type="text"
                    value={editingReview.clinic_name || ""}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, clinic_name: e.target.value })
                    }
                    placeholder="e.g. Uniklinik Düsseldorf"
                    className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Star Rating (1 - 5)
                  </label>
                  <select
                    value={editingReview.rating || 5}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, rating: parseInt(e.target.value) })
                    }
                    className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value={5}>5 Stars (★★★★★)</option>
                    <option value={4}>4 Stars (★★★★☆)</option>
                    <option value={3}>3 Stars (★★★☆☆)</option>
                    <option value={2}>2 Stars (★★☆☆☆)</option>
                    <option value={1}>1 Star (★☆☆☆☆)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Review Text (German / DE) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingReview.review_text_de || ""}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, review_text_de: e.target.value })
                  }
                  placeholder="Erfahrungsbericht auf Deutsch..."
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Review Text (English / EN)
                </label>
                <textarea
                  rows={3}
                  value={editingReview.review_text_en || ""}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, review_text_en: e.target.value })
                  }
                  placeholder="Review text in English..."
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingReview.verified ?? true}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, verified: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-gold-500 bg-[#070F1E] border-[#1E293B]"
                  />
                  <span>Verified Placement Badge</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingReview.is_featured ?? false}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, is_featured: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-gold-500 bg-[#070F1E] border-[#1E293B]"
                  />
                  <span>Feature on Homepage</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-slate-400 hover:text-white px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold px-5 py-2 rounded-xl text-xs transition-colors shadow"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
