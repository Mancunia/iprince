"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cmsService } from "@/lib/services/cmsService";
import type { BlogRow, FormSubmissionRow, ReviewRow } from "@/lib/supabase/database.types";

export default function AdminDashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [submissions, setSubmissions] = useState<FormSubmissionRow[]>([]);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [categoriesCount, setCategoriesCount] = useState(0);

  useEffect(() => {
    setSubmissions(cmsService.getSubmissions());
    setBlogs(cmsService.getBlogs());
    setReviews(cmsService.getReviews());
    setCategoriesCount(cmsService.getCategories().length);
  }, []);

  const newSubmissionsCount = submissions.filter((s) => s.status === "new").length;
  const publishedBlogsCount = blogs.filter((b) => b.status === "published").length;
  const pendingReviewsCount = reviews.filter((r) => r.status === "pending").length;

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#102A43] to-[#0B192C] border border-gold-500/30 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 text-9xl text-gold-500/5 font-black select-none pointer-events-none">
          ♛
        </div>
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Admin Executive Suite</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Welcome, Prince I.
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Manage all platform content, publish recruitment blogs, respond to customer inquiries from nurses and clinics, and curate verified testimonials.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              href={`/${locale}/admin/blogs/new`}
              className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md flex items-center gap-1.5"
            >
              <span>+ Create Blog Article</span>
            </Link>
            <Link
              href={`/${locale}/admin/content`}
              className="bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors border border-white/15 flex items-center gap-1.5"
            >
              <span>⚙ Edit Live Site Content</span>
            </Link>
            <Link
              href={`/${locale}/admin/submissions`}
              className="bg-navy-800 hover:bg-navy-700 text-gold-400 font-semibold px-4 py-2 rounded-xl text-xs transition-colors border border-gold-500/30 flex items-center gap-1.5"
            >
              <span>📬 View Inbox ({newSubmissionsCount} New)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Form Submissions */}
        <div className="bg-[#0B192C] border border-[#1E293B] hover:border-gold-500/40 rounded-2xl p-5 shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Customer Inquiries
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{submissions.length}</span>
            {newSubmissionsCount > 0 && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                {newSubmissionsCount} unread
              </span>
            )}
          </div>
          <Link
            href={`/${locale}/admin/submissions`}
            className="text-xs text-gold-400 group-hover:text-gold-300 font-medium inline-flex items-center gap-1 mt-4"
          >
            <span>Open Inquiries Inbox</span>
            <span>→</span>
          </Link>
        </div>

        {/* Blogs Published */}
        <div className="bg-[#0B192C] border border-[#1E293B] hover:border-gold-500/40 rounded-2xl p-5 shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Blog Articles
            </span>
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 text-gold-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{publishedBlogsCount}</span>
            <span className="text-xs text-slate-400">of {blogs.length} total</span>
          </div>
          <Link
            href={`/${locale}/admin/blogs`}
            className="text-xs text-gold-400 group-hover:text-gold-300 font-medium inline-flex items-center gap-1 mt-4"
          >
            <span>Manage All Articles</span>
            <span>→</span>
          </Link>
        </div>

        {/* Categories */}
        <div className="bg-[#0B192C] border border-[#1E293B] hover:border-gold-500/40 rounded-2xl p-5 shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Blog Categories
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{categoriesCount}</span>
            <span className="text-xs text-slate-400">active topics</span>
          </div>
          <Link
            href={`/${locale}/admin/categories`}
            className="text-xs text-gold-400 group-hover:text-gold-300 font-medium inline-flex items-center gap-1 mt-4"
          >
            <span>Edit Categories</span>
            <span>→</span>
          </Link>
        </div>

        {/* Reviews Rating */}
        <div className="bg-[#0B192C] border border-[#1E293B] hover:border-gold-500/40 rounded-2xl p-5 shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Client Satisfaction
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{averageRating}</span>
            <span className="text-xs text-amber-400">★ ★ ★ ★ ★</span>
          </div>
          <Link
            href={`/${locale}/admin/reviews`}
            className="text-xs text-gold-400 group-hover:text-gold-300 font-medium inline-flex items-center gap-1 mt-4"
          >
            <span>{pendingReviewsCount > 0 ? `${pendingReviewsCount} Pending Review` : "Moderate Reviews"}</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Two Column Section: Recent Submissions & Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions (2 cols) */}
        <div className="lg:col-span-2 bg-[#0B192C] border border-[#1E293B] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white">Recent Customer Submissions</h2>
              <p className="text-xs text-slate-400">Candidate CV applications and clinic inquiries</p>
            </div>
            <Link
              href={`/${locale}/admin/submissions`}
              className="text-xs text-gold-400 hover:underline font-semibold"
            >
              View All ({submissions.length})
            </Link>
          </div>

          <div className="divide-y divide-[#1E293B]">
            {submissions.slice(0, 4).map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      item.form_type === "candidate_cv"
                        ? "bg-blue-500/15 text-blue-400"
                        : item.form_type === "employer_request"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-emerald-500/15 text-emerald-400"
                    }`}
                  >
                    {item.form_type === "candidate_cv"
                      ? "CV"
                      : item.form_type === "employer_request"
                      ? "HQ"
                      : "MSG"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {item.company_name || item.profession || item.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      item.status === "new"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                        : item.status === "contacted"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {item.status}
                  </span>
                  <Link
                    href={`/${locale}/admin/submissions`}
                    className="text-xs text-slate-400 hover:text-white p-1 rounded hover:bg-white/5"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews (1 col) */}
        <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white">Client Reviews</h2>
                <p className="text-xs text-slate-400">Placed nurses & clinic leaders</p>
              </div>
              <Link
                href={`/${locale}/admin/reviews`}
                className="text-xs text-gold-400 hover:underline font-semibold"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-4">
              {reviews.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl bg-[#070F1E] border border-[#1E293B] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white truncate">{r.author_name}</span>
                    <span className="text-amber-400 text-xs">{"★".repeat(r.rating)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                    &ldquo;{r.review_text_de}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                    <span>{r.clinic_name || r.role_title}</span>
                    <span
                      className={
                        r.status === "approved" ? "text-emerald-400" : "text-amber-400"
                      }
                    >
                      ● {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href={`/${locale}/admin/reviews`}
            className="mt-4 w-full text-center py-2 bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white rounded-lg border border-white/10 transition-colors"
          >
            Moderate Reviews Queue →
          </Link>
        </div>
      </div>
    </div>
  );
}
