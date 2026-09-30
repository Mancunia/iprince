"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { cmsService } from "@/lib/services/cmsService";
import type { BlogRow, CategoryRow } from "@/lib/supabase/database.types";

interface BlogEditorProps {
  initialBlogId?: string;
}

const PRESET_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    label: "Hospital Doctors & Stethoscope",
  },
  {
    url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
    label: "Nurse with Patient Bedside",
  },
  {
    url: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80",
    label: "Intensive Care Unit (ICU)",
  },
  {
    url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
    label: "Surgical Operating Theater",
  },
  {
    url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1200&q=80",
    label: "German Clinic Consultation",
  },
];

export default function BlogEditor({ initialBlogId }: BlogEditorProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [contentTab, setContentTab] = useState<"de" | "en">("de");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<BlogRow>>({
    title_de: "",
    title_en: "",
    slug: "",
    excerpt_de: "",
    excerpt_en: "",
    content_de: "",
    content_en: "",
    category_id: "",
    featured_image: PRESET_IMAGES[0].url,
    author_name: "Prince I.",
    author_role: "Geschäftsführer / Founder",
    read_time_minutes: 5,
    language: "both",
    status: "published",
    is_featured: false,
  });

  useEffect(() => {
    const cats = cmsService.getCategories();
    setCategories(cats);

    if (initialBlogId) {
      const existing = cmsService.getBlogById(initialBlogId);
      if (existing) {
        setFormData(existing);
      }
    } else if (cats.length > 0) {
      setFormData((prev) => ({ ...prev, category_id: cats[0].id }));
    }
    setLoading(false);
  }, [initialBlogId]);

  const handleTitleChange = (val: string, lang: "de" | "en") => {
    if (lang === "de") {
      setFormData((prev) => ({
        ...prev,
        title_de: val,
        // Auto derive slug if not custom
        slug:
          !prev.slug || prev.slug === ""
            ? val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
            : prev.slug,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        title_en: val,
      }));
    }
  };

  const insertMarkdown = (syntax: string) => {
    const current = contentTab === "de" ? formData.content_de || "" : formData.content_en || "";
    let addition = "";
    if (syntax === "h2") addition = "\n## Abschnitts-Überschrift\n";
    if (syntax === "h3") addition = "\n### Detail-Überschrift\n";
    if (syntax === "bold") addition = " **wichtiger Begriff** ";
    if (syntax === "italic") addition = " *kursiver Text* ";
    if (syntax === "bullet") addition = "\n- Punkt 1\n- Punkt 2\n- Punkt 3\n";
    if (syntax === "quote") addition = "\n> Wichtiger Hinweis für Bewerber\n";

    if (contentTab === "de") {
      setFormData({ ...formData, content_de: current + addition });
    } else {
      setFormData({ ...formData, content_en: current + addition });
    }
  };

  const handleSubmit = (e: React.FormEvent, targetStatus?: "draft" | "published") => {
    e.preventDefault();
    if (!formData.title_de || !formData.title_en) {
      alert("Please provide both a German and English title.");
      return;
    }

    setSaving(true);
    const statusToSave = targetStatus || formData.status || "published";

    cmsService.saveBlog({
      ...formData,
      id: initialBlogId || formData.id,
      title_de: formData.title_de,
      title_en: formData.title_en,
      status: statusToSave,
    });

    setTimeout(() => {
      setSaving(false);
      router.push(`/${locale}/admin/blogs`);
    }, 400);
  };

  if (loading) {
    return <div className="p-8 text-white">Loading article editor...</div>;
  }

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6 max-w-5xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/blogs`}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {initialBlogId ? "Edit Blog Article" : "Write New Blog Article"}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Draft or publish bilingual recruitment and career articles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, "draft")}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, "published")}
            disabled={saving}
            className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold px-5 py-2 rounded-xl text-xs shadow-lg transition-colors flex items-center gap-1.5"
          >
            <span>{saving ? "Publishing..." : "Publish Article →"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Titles & Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Titles */}
          <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-gold-400">
              Article Titles & Slug
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Title (German / Deutsch) *
              </label>
              <input
                type="text"
                required
                value={formData.title_de || ""}
                onChange={(e) => handleTitleChange(e.target.value, "de")}
                placeholder="z.B. Das beschleunigte Fachkräfteverfahren (§ 81a AufenthG)"
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Title (English) *
              </label>
              <input
                type="text"
                required
                value={formData.title_en || ""}
                onChange={(e) => handleTitleChange(e.target.value, "en")}
                placeholder="e.g. The Accelerated Fast-Track Visa (§ 81a) Guide"
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                URL Slug
              </label>
              <div className="flex items-center bg-[#070F1E] border border-[#1E293B] focus-within:border-gold-500 rounded-xl px-3 py-2 text-xs">
                <span className="text-slate-500 font-mono">/blog/</span>
                <input
                  type="text"
                  value={formData.slug || ""}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="fast-track-visa-germany"
                  className="w-full bg-transparent text-gold-400 outline-none font-mono text-xs ml-1"
                />
              </div>
            </div>
          </div>

          {/* Excerpt / Summary */}
          <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-gold-400">
              Short Excerpt / Teaser
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Excerpt (German / DE)
              </label>
              <textarea
                rows={2}
                value={formData.excerpt_de || ""}
                onChange={(e) => setFormData({ ...formData, excerpt_de: e.target.value })}
                placeholder="Kurze Zusammenfassung für die Artikelkarte..."
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Excerpt (English / EN)
              </label>
              <textarea
                rows={2}
                value={formData.excerpt_en || ""}
                onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })}
                placeholder="Short summary displayed on cards and search results..."
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Rich Content Editor */}
          <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-gold-400">
                Article Body (Markdown Supported)
              </h2>

              <div className="flex bg-[#070F1E] p-1 rounded-xl border border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setContentTab("de")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    contentTab === "de"
                      ? "bg-gold-500 text-navy-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  German Content
                </button>
                <button
                  type="button"
                  onClick={() => setContentTab("en")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    contentTab === "en"
                      ? "bg-gold-500 text-navy-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  English Content
                </button>
              </div>
            </div>

            {/* Markdown Helper Toolbar */}
            <div className="flex flex-wrap gap-1.5 p-2 bg-[#070F1E] rounded-xl border border-[#1E293B] text-xs">
              <button
                type="button"
                onClick={() => insertMarkdown("h2")}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("h3")}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("bold")}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("italic")}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 italic"
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("bullet")}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("quote")}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300"
              >
                ❝ Quote
              </button>
            </div>

            {contentTab === "de" ? (
              <textarea
                rows={16}
                value={formData.content_de || ""}
                onChange={(e) => setFormData({ ...formData, content_de: e.target.value })}
                placeholder="Schreiben Sie hier den deutschen Artikelinhalt (Markdown unterstützt)..."
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl p-4 text-xs font-mono text-slate-200 outline-none leading-relaxed"
              />
            ) : (
              <textarea
                rows={16}
                value={formData.content_en || ""}
                onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                placeholder="Write the English article content here (Markdown supported)..."
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl p-4 text-xs font-mono text-slate-200 outline-none leading-relaxed"
              />
            )}
          </div>
        </div>

        {/* Right Column: Metadata & Settings (1 col) */}
        <div className="space-y-6">
          {/* Publication Settings */}
          <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-gold-400">
              Publishing Options
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                value={formData.category_id || ""}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="">Select a Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_de} ({c.name_en})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Publication Status
              </label>
              <select
                value={formData.status || "published"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as "draft" | "published" })
                }
                className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="published">Published (Visible on site)</option>
                <option value="draft">Draft (Hidden from public)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured || false}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 rounded text-gold-500 bg-[#070F1E] border-[#1E293B] focus:ring-0"
              />
              <label htmlFor="is_featured" className="text-xs text-slate-300 cursor-pointer">
                Highlight as Featured Article on Homepage
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Estimated Read Time (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={formData.read_time_minutes || 4}
                onChange={(e) =>
                  setFormData({ ...formData, read_time_minutes: parseInt(e.target.value) || 4 })
                }
                className="w-full bg-[#070F1E] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Author Details */}
          <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-gold-400">
              Author Information
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={formData.author_name || ""}
                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                className="w-full bg-[#070F1E] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Author Role / Title
              </label>
              <input
                type="text"
                value={formData.author_role || ""}
                onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
                className="w-full bg-[#070F1E] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-gold-400">
              Cover Image
            </h2>

            {formData.featured_image && (
              <div className="w-full h-36 rounded-xl overflow-hidden border border-[#1E293B]">
                <img
                  src={formData.featured_image}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={formData.featured_image || ""}
                onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                placeholder="https://..."
                className="w-full bg-[#070F1E] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-2">
                Or pick a curated healthcare stock photo:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({ ...formData, featured_image: img.url })}
                    className={`text-[10px] p-1.5 rounded-lg border text-left transition-all ${
                      formData.featured_image === img.url
                        ? "border-gold-500 bg-gold-500/15 text-gold-300"
                        : "border-[#1E293B] text-slate-400 hover:text-white"
                    }`}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
