"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cmsService } from "@/lib/services/cmsService";
import type { BlogRow, CategoryRow } from "@/lib/supabase/database.types";

export default function BlogsAdminPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const loadData = () => {
    const cats = cmsService.getCategories();
    setCategories(cats);

    const filtered = cmsService.getBlogs({
      categoryId: selectedCategory === "all" ? undefined : selectedCategory,
      status: selectedStatus === "all" ? undefined : selectedStatus,
      search: search.trim() || undefined,
    });
    setBlogs(filtered);
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, selectedStatus]);

  const handleToggleStatus = (blog: BlogRow) => {
    const newStatus = blog.status === "published" ? "draft" : "published";
    cmsService.saveBlog({
      ...blog,
      status: newStatus,
    });
    loadData();
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Delete blog post "${title}"? This cannot be undone.`)) {
      cmsService.deleteBlog(id);
      loadData();
    }
  };

  const getCategory = (catId: string | null) => {
    if (!catId) return null;
    return categories.find((c) => c.id === catId);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Blog Articles & Career Guides
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Write, curate, and publish guides for international nurses and hospital recruiters.
          </p>
        </div>

        <Link
          href={`/${locale}/admin/blogs/new`}
          className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
        >
          <span>+ Create New Article</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title..."
            className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
          />
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#070F1E] border border-[#1E293B] text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-gold-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_de}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#070F1E] border border-[#1E293B] text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-gold-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Blogs Table / List */}
      <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        {blogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-base font-bold text-white mb-1">No articles found</h3>
            <p className="text-xs text-slate-400 mb-4">
              Try adjusting your search criteria or create your first blog article.
            </p>
            <Link
              href={`/${locale}/admin/blogs/new`}
              className="bg-gold-500 text-navy-950 font-bold px-4 py-2 rounded-xl text-xs inline-block"
            >
              + Create Article
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#1E293B]">
            {blogs.map((blog) => {
              const cat = getCategory(blog.category_id);
              return (
                <div
                  key={blog.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Featured Image Thumbnail */}
                    <div className="w-20 h-16 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-[#1E293B] relative">
                      {blog.featured_image ? (
                        <img
                          src={blog.featured_image}
                          alt={blog.title_en}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                          No Pic
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {cat && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                            style={{
                              borderColor: `${cat.color_badge}40`,
                              color: cat.color_badge,
                              backgroundColor: `${cat.color_badge}15`,
                            }}
                          >
                            {cat.name_de}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            blog.status === "published"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {blog.status}
                        </span>
                        {blog.is_featured && (
                          <span className="text-[10px] font-semibold bg-gold-500/20 text-gold-400 border border-gold-500/30 px-2 py-0.5 rounded-md">
                            Featured
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white truncate max-w-xl">
                        {blog.title_de}
                      </h3>
                      <p className="text-xs text-slate-400 truncate max-w-xl">
                        {blog.title_en}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                        <span>By {blog.author_name}</span>
                        <span>•</span>
                        <span>{blog.read_time_minutes} min read</span>
                        <span>•</span>
                        <span className="font-mono">slug: /{blog.slug}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                    <button
                      onClick={() => handleToggleStatus(blog)}
                      title={blog.status === "published" ? "Unpublish" : "Publish"}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        blog.status === "published"
                          ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                          : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {blog.status === "published" ? "Unpublish" : "Publish"}
                    </button>

                    <Link
                      href={`/${locale}/admin/blogs/${blog.id}/edit`}
                      className="text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                    >
                      Edit
                    </Link>

                    {blog.status === "published" && (
                      <Link
                        href={`/${locale}/blog/${blog.slug}`}
                        target="_blank"
                        className="text-xs text-gold-400 hover:text-gold-300 bg-gold-500/10 hover:bg-gold-500/20 px-3 py-1.5 rounded-lg border border-gold-500/20 transition-colors"
                      >
                        Preview ↗
                      </Link>
                    )}

                    <button
                      onClick={() => handleDelete(blog.id, blog.title_de)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete article"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
