import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { z } from "zod";
import type { LocalizedText } from "@/lib/i18n/localized";
import { createServerSupabase } from "@/lib/supabase/server";
import { formStatus, type FormStatus, type ProfessionInput } from "./admin";

/** Stored translations may lack a language; admin forms show empty strings instead of failing. */
const storedText = z.object({ de: z.string().default(""), en: z.string().default("") }).catch({ de: "", en: "" });

export type AdminProfessionRow = {
  id: string;
  slug: string;
  name: LocalizedText;
  icon: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  openPositions: number;
  formStatus: FormStatus;
};

export async function listProfessionsForAdmin(): Promise<AdminProfessionRow[]> {
  const supabase = await createServerSupabase();
  const [professions, forms] = await Promise.all([
    supabase
      .from("professions")
      .select("id, slug, name, icon, is_active, is_featured, sort_order, open_positions, current_form_id")
      .order("is_featured", { ascending: false })
      .order("sort_order"),
    supabase.from("profession_forms").select("id, profession_id, version, published_at"),
  ]);
  if (professions.error) throw professions.error;
  if (forms.error) throw forms.error;
  return professions.data.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: storedText.parse(p.name),
    icon: p.icon,
    isActive: p.is_active,
    isFeatured: p.is_featured,
    sortOrder: p.sort_order,
    openPositions: p.open_positions,
    formStatus: formStatus(forms.data.filter((f) => f.profession_id === p.id), p.current_form_id),
  }));
}

export type AdminProfession = { id: string; currentFormId: string | null; values: ProfessionInput };

export async function getProfessionForAdmin(id: string): Promise<AdminProfession | null> {
  if (!z.guid().safeParse(id).success) return null;
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("professions")
    .select("id, slug, name, summary, icon, is_active, is_featured, sort_order, open_positions, current_form_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const name = storedText.parse(data.name);
  const summary = storedText.parse(data.summary);
  return {
    id: data.id,
    currentFormId: data.current_form_id,
    values: {
      slug: data.slug,
      nameDe: name.de,
      nameEn: name.en,
      summaryDe: summary.de,
      summaryEn: summary.en,
      icon: data.icon,
      isActive: data.is_active,
      isFeatured: data.is_featured,
      sortOrder: data.sort_order,
      openPositions: data.open_positions,
    },
  };
}

/** Icon names available in public/icons (Lucide SVGs). */
export const listIconNames = cache(async (): Promise<string[]> => {
  const files = await readdir(path.join(process.cwd(), "public", "icons"));
  return files.filter((f) => f.endsWith(".svg")).map((f) => f.slice(0, -4)).sort();
});
