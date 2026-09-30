"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cmsService } from "@/lib/services/cmsService";
import type { BlogRow, CategoryRow } from "@/lib/supabase/database.types";

export default function PublicBlogPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isGerman = locale === "de";

  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    setCategories(cmsService.getCategories());
    const allPublished = cmsService.getBlogs({
      status: "published",
      categoryId: selectedCat === "all" ? undefined : selectedCat,
      search: search.trim() || undefined,
    });
    setBlogs(allPublished);
  }, [selectedCat, search]);

  const featured = blogs.find((b) => b.is_featured) || blogs[0];
  const regularBlogs = blogs.filter((b) => b.id !== featured?.id);

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900/5 text-navy-900 text-xs font-bold uppercase tracking-wider">
            <span>{isGerman ? "iPrince Karriere-Magazin" : "iPrince Career Magazine"}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-navy-900 tracking-tight">
            {isGerman
              ? "Wissen, Leitfäden & Einblicke für Pflegefachkräfte"
              : "Healthcare Guides, Visa Insights & German Career Tips"}
          </h1>
          <p className="text-slate-600 text-base md:text-lg">
            {isGerman
              ? "Alles über das beschleunigte Visumverfahren (§ 81a), B2-Sprachprüfungen, Gehälter und das Leben in Deutschland."
              : "Practical advice on accelerated visas (§ 81a), B2 Telc nursing exams, hospital salary tariffs, and relocation."}
          </p>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedCat("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCat === "all"
                  ? "bg-navy-900 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {isGerman ? "Alle Themen" : "All Topics"}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedCat === c.id
                    ? "bg-gold-500 text-navy-900 shadow"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {isGerman ? c.name_de : c.name_en}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isGerman ? "Artikel durchsuchen..." : "Search articles..."}
              className="w-full bg-slate-50 border border-slate-200 focus:border-navy-900 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Featured Post Spotlight */}
        {featured && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200 grid grid-cols-1 lg:grid-cols-12 transition-all hover:shadow-xl">
            <div className="lg:col-span-7 h-64 lg:h-auto relative overflow-hidden bg-slate-800">
              <img
                src={featured.featured_image || ""}
                alt={isGerman ? featured.title_de : featured.title_en}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <span className="absolute top-4 left-4 bg-gold-500 text-navy-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                ★ {isGerman ? "Empfohlener Leitfaden" : "Featured Guide"}
              </span>
            </div>

            <div className="lg:col-span-5 p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>{featured.author_name}</span>
                  <span>•</span>
                  <span>{featured.read_time_minutes} min read</span>
                </div>

                <h2 className="text-2xl font-bold text-navy-900 leading-snug hover:text-gold-600 transition-colors">
                  <Link href={`/${locale}/blog/${featured.slug}`}>
                    {isGerman ? featured.title_de : featured.title_en}
                  </Link>
                </h2>

                <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                  {isGerman ? featured.excerpt_de : featured.excerpt_en}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/${locale}/blog/${featured.slug}`}
                  className="inline-flex items-center gap-2 text-navy-900 hover:text-gold-600 font-bold text-sm"
                >
                  <span>{isGerman ? "Weiterlesen" : "Read Full Guide"}</span>
                  <span>→</span>
                </Link>

                <span className="text-xs text-slate-400">
                  {featured.published_at ? new Date(featured.published_at).toLocaleDateString() : ""}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Regular Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularBlogs.map((blog) => {
            const cat = categories.find((c) => c.id === blog.category_id);
            return (
              <article
                key={blog.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="h-48 w-full bg-slate-800 overflow-hidden relative">
                    <img
                      src={blog.featured_image || ""}
                      alt={isGerman ? blog.title_de : blog.title_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {cat && (
                      <span
                        className="absolute bottom-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-lg text-white shadow-md backdrop-blur-sm"
                        style={{ backgroundColor: `${cat.color_badge}E6` }}
                      >
                        {isGerman ? cat.name_de : cat.name_en}
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{blog.author_name}</span>
                      <span>•</span>
                      <span>{blog.read_time_minutes} min</span>
                    </div>

                    <h3 className="text-lg font-bold text-navy-900 group-hover:text-gold-600 transition-colors line-clamp-2">
                      <Link href={`/${locale}/blog/${blog.slug}`}>
                        {isGerman ? blog.title_de : blog.title_en}
                      </Link>
                    </h3>

                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                      {isGerman ? blog.excerpt_de : blog.excerpt_en}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <Link
                    href={`/${locale}/blog/${blog.slug}`}
                    className="text-xs font-bold text-navy-900 group-hover:text-gold-600 transition-colors flex items-center gap-1 pt-3"
                  >
                    <span>{isGerman ? "Artikel lesen" : "Read Article"}</span>
                    <span>→</span>
                  </Link>

                  <span className="text-[11px] text-slate-400 pt-3">
                    {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : ""}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
