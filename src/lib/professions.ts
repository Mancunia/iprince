import type { Locale } from "@/i18n/config";

// Professions are admin-managed data (Supabase `professions` where featured = true).
// Until that table exists, the home page renders this illustrative sample from the design.
export interface FeaturedProfession {
  slug: string;
  name: Record<Locale, string>;
  /** Lucide icon name, served from /public/icons. */
  icon: string;
  openPositions: number;
}

const SAMPLE: FeaturedProfession[] = [
  { slug: "pflege", name: { de: "Pflege & Gesundheit", en: "Nursing & healthcare" }, icon: "heart-handshake", openPositions: 24 },
  { slug: "elektro", name: { de: "Elektro- und Anlagentechnik", en: "Electrical & plant engineering" }, icon: "zap", openPositions: 11 },
  { slug: "gastro", name: { de: "Hotellerie & Gastronomie", en: "Hospitality & catering" }, icon: "utensils", openPositions: 17 },
  { slug: "handwerk", name: { de: "Handwerk & Bau", en: "Skilled trades & construction" }, icon: "hard-hat", openPositions: 9 },
  { slug: "it", name: { de: "IT & Softwareentwicklung", en: "IT & software development" }, icon: "code", openPositions: 6 },
  { slug: "logistik", name: { de: "Logistik & Berufskraftfahrer", en: "Logistics & professional drivers" }, icon: "truck", openPositions: 13 },
];

export async function getFeaturedProfessions(): Promise<FeaturedProfession[]> {
  return SAMPLE;
}
