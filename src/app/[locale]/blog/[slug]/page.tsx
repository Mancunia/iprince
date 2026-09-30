"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { cmsService } from "@/lib/services/cmsService";
import type { BlogRow, CategoryRow } from "@/lib/supabase/database.types";

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const locale = (params?.locale as string) || "en";
  const isGerman = locale === "de";

  const [blog, setBlog] = useState<BlogRow | null>(null);
  const [category, setCategory] = useState<CategoryRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const found = cmsService.getBlogBySlug(slug);
    if (found) {
      setBlog(found);
      if (found.category_id) {
        const cats = cmsService.getCategories();
        const cat = cats.find((c) => c.id === found.category_id);
        if (cat) setCategory(cat);
      }
    }
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="w-8 h-8 border-3 border-navy-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!blog) {
    return notFound();
  }

  const title = isGerman ? blog.title_de : blog.title_en;
  const content = isGerman ? blog.content_de : blog.content_en;

  // Simple Markdown Line Formatter
  const renderFormattedContent = (rawText: string) => {
    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xl font-bold text-navy-900 mt-6 mb-3">
            {trimmed.replace("### ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-2xl font-bold text-navy-900 mt-8 mb-4 pb-2 border-b border-slate-200">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("- ")) {
        return (
          <li key={idx} className="ml-5 list-disc text-slate-700 my-1">
            {trimmed.replace("- ", "")}
          </li>
        );
      }
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote
            key={idx}
            className="my-6 p-4 rounded-xl bg-gold-50 border-l-4 border-gold-500 text-navy-900 font-medium text-sm italic"
          >
            {trimmed.replace("> ", "")}
          </blockquote>
        );
      }
      if (trimmed === "") {
        return <div key={idx} className="h-3" />;
      }
      return (
        <p key={idx} className="text-slate-700 leading-relaxed my-2 text-base">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <article className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href={`/${locale}`} className="hover:text-navy-900">
            {isGerman ? "Startseite" : "Home"}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/blog`} className="hover:text-navy-900">
            Blog
          </Link>
          <span>/</span>
          <span className="text-slate-800 truncate max-w-xs">{title}</span>
        </nav>

        {/* Article Header */}
        <header className="space-y-4">
          {category && (
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full text-white shadow-sm"
              style={{ backgroundColor: category.color_badge }}
            >
              {isGerman ? category.name_de : category.name_en}
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-xs">
                {blog.author_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-navy-900">{blog.author_name}</p>
                <p className="text-[11px] text-slate-500">{blog.author_role}</p>
              </div>
            </div>

            <span>•</span>
            <span>{blog.read_time_minutes} min read</span>
            <span>•</span>
            <span>
              {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : ""}
            </span>
          </div>
        </header>

        {/* Featured Image */}
        {blog.featured_image && (
          <div className="rounded-3xl overflow-hidden shadow-lg aspect-video bg-slate-900">
            <img
              src={blog.featured_image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm border border-slate-200">
          <div className="prose max-w-none text-slate-800">
            {renderFormattedContent(content)}
          </div>
        </div>

        {/* Call to Action Box for Nurses */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white rounded-3xl p-8 md:p-10 shadow-xl border border-gold-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
              {isGerman ? "100% Kostenfreie Vermittlung" : "100% Free Placement"}
            </span>
            <h3 className="text-2xl font-bold text-white">
              {isGerman
                ? "Bereit für Ihre Pflegekarriere in Deutschland?"
                : "Ready to start your nursing career in Germany?"}
            </h3>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              {isGerman
                ? "Bewerben Sie sich jetzt mit wenigen Klicks. Wir übernehmen das beschleunigte Visumverfahren (§ 81a), vermitteln an Top-Kliniken und organisieren Ihren Wohnraum."
                : "Fast-track visa processing, certified hospital placements, and accommodation support. Zero fees for applicants."}
            </p>
          </div>

          <Link
            href={`/${locale}/submit-cv`}
            className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold px-6 py-3.5 rounded-xl text-sm transition-colors shadow-lg flex-shrink-0 text-center"
          >
            {isGerman ? "Jetzt Lebenslauf einreichen →" : "Submit Your CV Now →"}
          </Link>
        </div>
      </div>
    </article>
  );
}
