import type { TextKey } from "./content";

/** label = key under admin.content.fields; group = key under admin.content.groups. */
export type FieldSpec = { path: string; label: string; long?: boolean; localized: boolean };
export type FieldGroup = { group?: string; fields: FieldSpec[] };

const t = (path: string, label: string, long = false): FieldSpec => ({ path, label, long, localized: true });

export const SECTION_FIELDS: Record<TextKey, FieldGroup[]> = {
  "home.hero": [{ fields: [t("kicker", "kicker"), t("title", "title"), t("lead", "lead", true)] }],
  "home.features": [
    { group: "match", fields: [t("match.eyebrow", "eyebrow"), t("match.title", "title"), t("match.text", "text", true)] },
    {
      group: "advisors",
      fields: [
        t("advisors.eyebrow", "eyebrow"), t("advisors.title", "title"), t("advisors.text", "text", true),
        t("advisors.badgeTitle", "badgeTitle"), t("advisors.badgeText", "badgeText"),
      ],
    },
  ],
  "home.steps": [
    { fields: [t("kicker", "kicker"), t("title", "title")] },
    { group: "choose", fields: [t("choose.title", "title"), t("choose.text", "text", true)] },
    { group: "apply", fields: [t("apply.title", "title"), t("apply.text", "text", true)] },
    { group: "contact", fields: [t("contact.title", "title"), t("contact.text", "text", true)] },
  ],
  "home.employers": [{ fields: [t("kicker", "kicker"), t("title", "title"), t("text", "text", true)] }],
  contact: [
    {
      fields: [
        { path: "whatsapp", label: "whatsapp", localized: false },
        { path: "email", label: "email", localized: false },
        { path: "address", label: "address", long: true, localized: false },
      ],
    },
  ],
};

export function getAt(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined), value);
}
