"use client";

import React, { useState, useEffect } from "react";
import { cmsService } from "@/lib/services/cmsService";
import type { CategoryRow } from "@/lib/supabase/database.types";

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [blogs, setBlogs] = useState(cmsService.getBlogs());
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryRow> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    setCategories(cmsService.getCategories());
    setBlogs(cmsService.getBlogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory({
      slug: "",
      name_de: "",
      name_en: "",
      description_de: "",
      description_en: "",
      color_badge: "#D4AF37",
      icon: "folder",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryRow) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete category "${name}"?`)) {
      cmsService.deleteCategory(id);
      loadData();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name_de || !editingCategory?.name_en) return;

    const slug =
      editingCategory.slug ||
      editingCategory.name_en
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    cmsService.saveCategory({
      id: editingCategory.id,
      slug,
      name_de: editingCategory.name_de,
      name_en: editingCategory.name_en,
      description_de: editingCategory.description_de || null,
      description_en: editingCategory.description_en || null,
      color_badge: editingCategory.color_badge || "#D4AF37",
      icon: editingCategory.icon || "folder",
    });

    setIsModalOpen(false);
    setEditingCategory(null);
    loadData();
  };

  const getArticleCount = (catId: string) => {
    return blogs.filter((b) => b.category_id === catId).length;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Blog Categories
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Organize healthcare recruitment articles, fast-track visa guides, and integration tips into categories.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
        >
          <span>+ Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map((cat) => {
          const articleCount = getArticleCount(cat.id);
          return (
            <div
              key={cat.id}
              className="bg-[#0B192C] border border-[#1E293B] hover:border-gold-500/30 rounded-2xl p-6 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10"
                      style={{ backgroundColor: cat.color_badge }}
                    />
                    <span className="font-mono text-[11px] text-slate-400">/{cat.slug}</span>
                  </div>
                  <span className="text-[11px] font-semibold bg-white/5 text-slate-300 px-2.5 py-0.5 rounded-full border border-white/10">
                    {articleCount} {articleCount === 1 ? "Article" : "Articles"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{cat.name_de}</h3>
                <p className="text-xs text-gold-400 font-medium mb-3">{cat.name_en}</p>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {cat.description_de || cat.description_en || "No description provided."}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-5 mt-5 border-t border-[#1E293B]">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="text-xs text-slate-300 hover:text-gold-400 font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name_de)}
                  className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create / Edit Category */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-[#1E293B] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h2 className="text-base font-bold text-white">
                {editingCategory.id ? "Edit Category" : "New Blog Category"}
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
                    Name (German / DE) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name_de || ""}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name_de: e.target.value })
                    }
                    placeholder="e.g. Pflegekarriere"
                    className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Name (English / EN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name_en || ""}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name_en: e.target.value })
                    }
                    placeholder="e.g. Nursing Careers"
                    className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  URL Slug (Auto-generated if empty)
                </label>
                <input
                  type="text"
                  value={editingCategory.slug || ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, slug: e.target.value })
                  }
                  placeholder="e.g. nursing-careers"
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Color Accent
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editingCategory.color_badge || "#D4AF37"}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, color_badge: e.target.value })
                    }
                    className="w-10 h-8 rounded border border-[#1E293B] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-400">
                    {editingCategory.color_badge || "#D4AF37"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description (German)
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.description_de || ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description_de: e.target.value })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description (English)
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.description_en || ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description_en: e.target.value })
                  }
                  className="w-full bg-[#070F1E] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white"
                />
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
