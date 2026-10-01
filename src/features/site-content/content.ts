import { z } from "zod";
import de from "@/i18n/messages/de.json";
import en from "@/i18n/messages/en.json";
import { PHOTO_SLOTS, type PhotoSlot } from "@/features/site/photos";

export const CONTENT_KEYS = [
  "home.hero", "home.features", "home.steps", "home.employers", "contact", "photos", "legal.imprint", "legal.privacy",
] as const;
export type ContentKey = (typeof CONTENT_KEYS)[number];
export const TEXT_KEYS = ["home.hero", "home.features", "home.steps", "home.employers", "contact"] as const satisfies readonly ContentKey[];
export type TextKey = (typeof TEXT_KEYS)[number];
export const LEGAL_KEYS = ["legal.imprint", "legal.privacy"] as const satisfies readonly ContentKey[];
export type LegalKey = (typeof LEGAL_KEYS)[number];

/** URL segments for the admin editor. They contain no dots: proxy.ts skips paths with a dot. */
export const SECTION_SLUGS: Record<ContentKey, string> = {
  "home.hero": "hero",
  "home.features": "features",
  "home.steps": "steps",
  "home.employers": "employers",
  contact: "contact",
  photos: "photos",
  "legal.imprint": "imprint",
  "legal.privacy": "privacy",
};

export function keyFromSlug(slug: string): ContentKey | null {
  return CONTENT_KEYS.find((key) => SECTION_SLUGS[key] === slug) ?? null;
}

export const isLegalKey = (key: ContentKey): key is LegalKey => key.startsWith("legal.");
export const isTextKey = (key: ContentKey): key is TextKey => (TEXT_KEYS as readonly string[]).includes(key);

/** Translated text with German required, English optional. */
const text = (max: number) => z.object({ de: z.string().trim().min(1).max(max), en: z.string().trim().max(max).default("") });
/** Translated text that may be empty in both languages (alt text of a decorative photo). */
const optionalText = (max: number) => z.object({ de: z.string().trim().max(max).default(""), en: z.string().trim().max(max).default("") });
const short = text(200);
const long = text(1000);

const feature = z.object({ eyebrow: short, title: short, text: long });
const step = z.object({ title: short, text: long });

/** `<slot>/<uuid>.<ext>`, exactly as the admin upload names it. */
export function photoPathFor(slot: PhotoSlot): RegExp {
  return new RegExp(`^${slot}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp)$`);
}

const photo = (slot: PhotoSlot) => z.object({ path: z.string().regex(photoPathFor(slot)).nullable().default(null), alt: optionalText(200) });

export const contentSchemas = {
  "home.hero": z.object({ kicker: short, title: short, lead: long }),
  "home.features": z.object({ match: feature, advisors: feature.extend({ badgeTitle: short, badgeText: short }) }),
  "home.steps": z.object({ kicker: short, title: short, choose: step, apply: step, contact: step }),
  "home.employers": z.object({ kicker: short, title: short, text: long }),
  contact: z.object({
    whatsapp: z.string().trim().max(30).refine((value) => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15;
    }),
    email: z.union([z.literal(""), z.email().max(254)]).default(""),
    address: z.string().trim().max(500).default(""),
  }),
  photos: z.object({
    hero: photo("hero"),
    "feature-match": photo("feature-match"),
    "feature-advisors": photo("feature-advisors"),
    steps: photo("steps"),
    "employer-banner": photo("employer-banner"),
  }),
  "legal.imprint": z.object({ body: text(50_000) }),
  "legal.privacy": z.object({ body: text(50_000) }),
} satisfies Record<ContentKey, z.ZodType>;

export type SiteContent = { [K in ContentKey]: z.output<(typeof contentSchemas)[K]> };
export type ContentRow = { key: string; value: unknown };

type Messages = typeof en;
const both = (pick: (m: Messages) => string) => ({ de: pick(de as unknown as Messages), en: pick(en) });

/** What the site shows for a key without a stored row: today's copy from messages/*.json. */
export const defaults: SiteContent = {
  "home.hero": { kicker: both((m) => m.home.kicker), title: both((m) => m.home.title), lead: both((m) => m.home.lead) },
  "home.features": {
    match: {
      eyebrow: both((m) => m.home.features.match.eyebrow),
      title: both((m) => m.home.features.match.title),
      text: both((m) => m.home.features.match.text),
    },
    advisors: {
      eyebrow: both((m) => m.home.features.advisors.eyebrow),
      title: both((m) => m.home.features.advisors.title),
      text: both((m) => m.home.features.advisors.text),
      badgeTitle: both((m) => m.home.features.advisors.badgeTitle),
      badgeText: both((m) => m.home.features.advisors.badgeText),
    },
  },
  "home.steps": {
    kicker: both((m) => m.home.stepsKicker),
    title: both((m) => m.home.stepsTitle),
    choose: { title: both((m) => m.home.steps.choose.title), text: both((m) => m.home.steps.choose.text) },
    apply: { title: both((m) => m.home.steps.apply.title), text: both((m) => m.home.steps.apply.text) },
    contact: { title: both((m) => m.home.steps.contact.title), text: both((m) => m.home.steps.contact.text) },
  },
  "home.employers": {
    kicker: both((m) => m.home.doors.employerKicker),
    title: both((m) => m.home.doors.employerTitle),
    text: both((m) => m.home.doors.employerText),
  },
  contact: { whatsapp: "+49 173 9018671", email: "", address: "" },
  photos: {
    hero: { path: null, alt: both((m) => m.home.heroAlt) },
    "feature-match": { path: null, alt: both((m) => m.home.features.match.alt) },
    "feature-advisors": { path: null, alt: both((m) => m.home.features.advisors.alt) },
    steps: { path: null, alt: both((m) => m.home.stepsAlt) },
    "employer-banner": { path: null, alt: { de: "", en: "" } },
  },
  // The real legal texts are inserted by migration 20261001000003; these only show if a row is deleted.
  "legal.imprint": { body: { de: "[PLATZHALTER: Impressum]", en: "" } },
  "legal.privacy": { body: { de: "[PLATZHALTER: Datenschutzerklärung]", en: "" } },
};

/** Stored rows over defaults, key by key. A row that fails its schema is reported and replaced by the default. */
export function resolveContent(rows: ContentRow[], onInvalid?: (key: ContentKey) => void): SiteContent {
  const content = { ...defaults } as Record<ContentKey, unknown>;
  for (const key of CONTENT_KEYS) {
    const row = rows.find((r) => r.key === key);
    if (!row) continue;
    const parsed = contentSchemas[key].safeParse(row.value);
    if (parsed.success) content[key] = parsed.data;
    else onInvalid?.(key);
  }
  return content as SiteContent;
}

export function whatsappHref(display: string): string {
  return `https://wa.me/${display.replace(/\D/g, "")}`;
}

export { PHOTO_SLOTS };
export { photoSrc } from "./photo-url";
