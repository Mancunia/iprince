# 2d Site Content, Photos and Legal Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins edit key home copy, contact details and the five site photos without a deploy; the owner edits Impressum and Datenschutzerklärung as markdown; production cannot launch while the legal texts contain placeholders.

**Architecture:** One `site_content` row per section key, each validated by its own zod schema in `src/features/site-content/content.ts`. `getSiteContent()` reads all rows once per request and falls back per key to defaults built from today's `messages/*.json` copy. Admin pages under `/admin/content/<slug>` write with the admin's session; RLS splits copy (all admins) from `legal.*` (owner only). Photos go browser → `site` bucket with the admin session, then a server action records the path.

**Tech Stack:** Next 16.3 App Router, React 19, Tailwind 4, next-intl 4, Supabase (`@supabase/ssr`), zod 4, `react-markdown` 10 + `remark-gfm` 4, Vitest, pgTAP, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-01-site-content-design.md`

## Global Constraints

- Branch `feat/site-content`. Never push, merge or deploy without the user asking in that moment.
- Every admin server action calls `requireAdmin(locale)` (or `requireOwner(locale)` for `legal.*`) before parsing any other input.
- Admin reads/writes use the admin's session (`createServerSupabase()`); no service role anywhere in this plan except e2e fixtures.
- Every user-visible string goes into both `src/i18n/messages/de.json` and `en.json`. Translated content is `{de, en}` with `de` required (legal and copy) and `en` falling back to `de` via `localized()`.
- Styling: Tailwind utilities for layout, design-system classes from `src/styles/components.css`, semantic tokens only, never StyleX.
- Logs never contain personal data (log `error.code`, never values).
- Next.js is v16: read `node_modules/next/dist/docs/` before using an unfamiliar API.
- `npm run check` (needs `npx supabase start`) passes before every commit; `npm run test:e2e` before merge.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Admin edit URLs use dot-free slugs (`/admin/content/privacy`), because `src/proxy.ts`'s matcher skips any path containing a dot (no locale handling, no session refresh).
- Photo files: `site` bucket, ≤ 5 MB (5242880 bytes), `image/jpeg`, `image/png`, `image/webp`; object path `<slot>/<uuid>.<jpg|png|webp>`.
- Placeholder marker: `[PLATZHALTER` (both languages use it).

## Review Focus

1. **A stored value that no longer matches its schema** (e.g. after a later schema change) must render the default, not crash the home page → Task 2 test `resolveContent falls back per key on invalid values`.
2. **Supabase unreachable while rendering public pages** must render defaults, not a 500 → Task 4 `getSiteContent` returns `defaults` on error (logged by code only); covered by `resolveContent([])` test plus code review.
3. **A forged `setSitePhoto` path** (other slot, `../`, other extension, file that was never uploaded) must be rejected → Task 8 tests on `photoPathFor` and the existence check.
4. **An editor POSTing straight to `saveSiteContent` with `section=privacy`** must be refused by both `requireOwner` and RLS → Task 1 pgTAP + Task 6 action uses `requireOwner` for legal slugs.
5. **Markdown with raw HTML / `javascript:` links** in a legal page must not execute → Task 3 Markdown tests.

---

## File Map

| File | Responsibility |
|---|---|
| `supabase/migrations/20261001000002_site_content.sql` | split RLS, key check, `site` bucket |
| `supabase/migrations/20261001000003_legal_drafts.sql` | insert the two legal drafts |
| `supabase/tests/database/site_content.test.sql` | pgTAP for the above |
| `src/features/site-content/content.ts` | keys, slugs, schemas, defaults, `resolveContent`, `whatsappHref`, `photoSrc`, `photoPathFor` |
| `src/features/site-content/legal-check.ts` | `hasPlaceholder`, `legalProblems` (no `@/` imports; used by the CLI script) |
| `src/features/site-content/legal-draft.ts` | draft markdown de/en |
| `src/features/site-content/sections.ts` | admin field layout per text section |
| `src/features/site-content/form-data.ts` | `unflatten`, `parseSectionForm`, `fieldErrorsByPath` |
| `src/features/site-content/queries.ts` | `getSiteContent`, `getContentMeta` |
| `src/features/site-content/admin-actions.ts` | save/reset actions |
| `src/features/site-content/photo-actions.ts` | set/remove photo, save alt texts |
| `src/features/site-content/photo-url.ts` | `photoSrc` (client-safe, no message imports) |
| `src/features/site-content/SectionForm.tsx`, `LegalForm.tsx`, `PhotosEditor.tsx`, `ResetSectionForm.tsx`, `LegalArticle.tsx` | UI |
| `src/ui/Markdown.tsx` | shared safe markdown renderer |
| `scripts/check-legal.ts` | launch gate |
| `src/app/[locale]/(site)/imprint/page.tsx`, `privacy/page.tsx` | public legal pages |
| `src/app/[locale]/admin/(protected)/content/page.tsx`, `[section]/page.tsx` | admin |

---

### Task 1: Migration, RLS split and `site` bucket

**Files:**
- Create: `supabase/migrations/20261001000002_site_content.sql`
- Create: `supabase/tests/database/site_content.test.sql`
- Modify: `src/lib/supabase/database.types.ts` (regenerated)

**Interfaces:**
- Produces: policies `site_content_admin_copy`, `site_content_owner_legal`; constraint `site_content_key_known`; bucket `site`.

- [ ] **Step 1: Write the failing pgTAP test**

`supabase/tests/database/site_content.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('13000000-0000-0000-0000-000000000001', 'sc-owner@test.local'),
  ('13000000-0000-0000-0000-000000000002', 'sc-editor@test.local');
insert into public.admins (user_id, role, display_name) values
  ('13000000-0000-0000-0000-000000000001', 'owner', 'Owner'),
  ('13000000-0000-0000-0000-000000000002', 'editor', 'Editor');
delete from public.site_content where key in ('home.hero', 'legal.privacy');
insert into public.site_content (key, value) values
  ('home.hero', '{"v":"seed"}'),
  ('legal.privacy', '{"v":"seed"}');

select throws_ok($$insert into public.site_content (key, value) values ('home.unknown', '{}')$$, '23514', null, 'unknown keys are rejected');

set local role anon;
select is((select count(*)::int from public.site_content where key in ('home.hero', 'legal.privacy')), 2, 'anon reads all content');
update public.site_content set value = '{"v":"anon"}' where key = 'home.hero';
select throws_ok($$insert into public.site_content (key, value) values ('contact', '{}')$$, '42501', null, 'anon cannot insert');
reset role;
select is((select value->>'v' from public.site_content where key = 'home.hero'), 'seed', 'anon cannot update');

set local role authenticated;
set local request.jwt.claims = '{"sub":"13000000-0000-0000-0000-000000000002","role":"authenticated"}';
update public.site_content set value = '{"v":"editor"}' where key = 'home.hero';
update public.site_content set value = '{"v":"editor"}' where key = 'legal.privacy';
select throws_ok($$insert into public.site_content (key, value) values ('legal.imprint', '{}') on conflict (key) do update set value = excluded.value$$, '42501', null, 'an editor cannot write legal rows');
reset role;
select is((select value->>'v' from public.site_content where key = 'home.hero'), 'editor', 'an editor can update copy');
select is((select value->>'v' from public.site_content where key = 'legal.privacy'), 'seed', 'an editor cannot update legal rows');

set local role authenticated;
set local request.jwt.claims = '{"sub":"13000000-0000-0000-0000-000000000001","role":"authenticated"}';
update public.site_content set value = '{"v":"owner"}' where key = 'legal.privacy';
reset role;
select is((select value->>'v' from public.site_content where key = 'legal.privacy'), 'owner', 'the owner can update legal rows');

set local role anon;
select throws_ok($$insert into storage.objects (bucket_id, name) values ('site', 'hero/x.jpg')$$, '42501', null, 'anon cannot upload to site');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"13000000-0000-0000-0000-000000000002","role":"authenticated"}';
select lives_ok($$insert into storage.objects (bucket_id, name) values ('site', 'hero/00000000-0000-0000-0000-000000000000.jpg')$$, 'an admin can upload to site');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx supabase test db`
Expected: `site_content.test.sql` fails (unknown key accepted, editor can write legal rows, bucket `site` missing).

- [ ] **Step 3: Write the migration**

`supabase/migrations/20261001000002_site_content.sql`:

```sql
-- 2d: editable site content. Copy is for all admins, legal pages for the owner only.
drop policy site_content_admin_all on public.site_content;

create policy site_content_admin_copy on public.site_content
  for all to authenticated
  using ((select public.is_admin()) and key not like 'legal.%')
  with check ((select public.is_admin()) and key not like 'legal.%');

create policy site_content_owner_legal on public.site_content
  for all to authenticated
  using ((select public.is_owner()) and key like 'legal.%')
  with check ((select public.is_owner()) and key like 'legal.%');

-- Keep in step with CONTENT_KEYS in src/features/site-content/content.ts.
alter table public.site_content add constraint site_content_key_known check (key in (
  'home.hero', 'home.features', 'home.steps', 'home.employers', 'contact', 'photos', 'legal.imprint', 'legal.privacy'));

-- Site photos. Storage enforces size and type on upload, so the server action only checks the path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site', 'site', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "site bucket: admins write" on storage.objects
  for all to authenticated
  using (bucket_id = 'site' and (select public.is_admin()))
  with check (bucket_id = 'site' and (select public.is_admin()));
```

- [ ] **Step 4: Apply and run the tests**

Run: `npx supabase db reset && npx supabase test db`
Expected: all files pass, `site_content.test.sql` 10/10.

- [ ] **Step 5: Regenerate types**

Run: `npm run db:types && git diff --stat src/lib/supabase/database.types.ts`
Expected: no change or a trivial one (`site_content` columns are unchanged); keep whatever is generated.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261001000002_site_content.sql supabase/tests/database/site_content.test.sql src/lib/supabase/database.types.ts
git commit -m "feat(db): split site_content RLS for legal pages and add site photo bucket

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Content model (`content.ts`, `legal-check.ts`)

**Files:**
- Create: `src/features/site-content/content.ts`, `src/features/site-content/photo-url.ts`, `src/features/site-content/content.test.ts`
- Create: `src/features/site-content/legal-check.ts`, `src/features/site-content/legal-check.test.ts`

**Interfaces:**
- Consumes: `PHOTO_SLOTS`, `PhotoSlot` from `@/features/site/photos`; `readPublicEnv` from `@/env` (in `photo-url.ts`).
- Produces:
  - `CONTENT_KEYS`, `type ContentKey`, `SECTION_SLUGS: Record<ContentKey, string>`, `keyFromSlug(slug: string): ContentKey | null`, `isLegalKey(key): boolean`, `TEXT_KEYS` (`home.*` + `contact`), `type TextKey`, `LEGAL_KEYS`, `type LegalKey`
  - `contentSchemas: { [K in ContentKey]: z.ZodType }`, `type SiteContent = { [K in ContentKey]: z.output<(typeof contentSchemas)[K]> }`, `type ContentRow = { key: string; value: unknown }`
  - `defaults: SiteContent`, `resolveContent(rows: ContentRow[], onInvalid?: (key: ContentKey) => void): SiteContent`
  - `whatsappHref(display: string): string`, `photoPathFor(slot: PhotoSlot): RegExp`, `photoSrc(path: string | null): string | null`
  - `legal-check.ts`: `PLACEHOLDER = "[PLATZHALTER"`, `hasPlaceholder(text: string): boolean`, `legalProblems(rows: { key: string; value: unknown }[]): string[]`

- [ ] **Step 1: Write the failing tests**

`src/features/site-content/content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import { CONTENT_KEYS, contentSchemas, defaults, keyFromSlug, photoPathFor, resolveContent, SECTION_SLUGS, whatsappHref } from "./content";

describe("defaults", () => {
  it.each(CONTENT_KEYS)("%s default satisfies its schema", (key) => {
    expect(contentSchemas[key].safeParse(defaults[key]).success).toBe(true);
  });

  it("uses today's home copy", () => {
    expect(defaults["home.hero"].title.en).toBe(en.home.title);
    expect(defaults["home.steps"].apply.text.en).toBe(en.home.steps.apply.text);
    expect(defaults.photos.hero.alt.en).toBe(en.home.heroAlt);
    expect(defaults.photos.hero.path).toBeNull();
  });
});

describe("resolveContent", () => {
  it("returns defaults when there are no rows", () => expect(resolveContent([])).toEqual(defaults));

  it("uses a valid stored value", () => {
    const hero = { kicker: { de: "K", en: "" }, title: { de: "T", en: "Title" }, lead: { de: "L", en: "" } };
    expect(resolveContent([{ key: "home.hero", value: hero }])["home.hero"]).toEqual(hero);
  });

  it("falls back per key on invalid values", () => {
    const invalid: string[] = [];
    const content = resolveContent(
      [{ key: "home.hero", value: { title: 42 } }, { key: "contact", value: { whatsapp: "+49 30 1234567" } }],
      (key) => invalid.push(key),
    );
    expect(content["home.hero"]).toEqual(defaults["home.hero"]);
    expect(content.contact.whatsapp).toBe("+49 30 1234567");
    expect(invalid).toEqual(["home.hero"]);
  });

  it("ignores unknown keys", () => expect(resolveContent([{ key: "other", value: {} }])).toEqual(defaults));
});

describe("contact schema", () => {
  const parse = (value: unknown) => contentSchemas.contact.safeParse(value);
  it("accepts a number with 7–15 digits", () => expect(parse({ whatsapp: "+49 173 9018671" }).success).toBe(true));
  it("rejects too few digits", () => expect(parse({ whatsapp: "+49 12" }).success).toBe(false));
  it("rejects a bad email", () => expect(parse({ whatsapp: "+49 173 9018671", email: "nope" }).success).toBe(false));
  it("allows an empty email and address", () => {
    expect(parse({ whatsapp: "+49 173 9018671", email: "", address: "" }).success).toBe(true);
  });
});

describe("text schemas", () => {
  it("require German", () => {
    const value = { kicker: { de: "", en: "K" }, title: { de: "T" }, lead: { de: "L" } };
    expect(contentSchemas["home.hero"].safeParse(value).success).toBe(false);
  });
  it("cap length", () => {
    const value = { kicker: { de: "K" }, title: { de: "x".repeat(201) }, lead: { de: "L" } };
    expect(contentSchemas["home.hero"].safeParse(value).success).toBe(false);
  });
});

describe("slugs", () => {
  it("are unique and dot-free", () => {
    const slugs = Object.values(SECTION_SLUGS);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z]+$/);
  });
  it("map back to keys", () => {
    expect(keyFromSlug("privacy")).toBe("legal.privacy");
    expect(keyFromSlug("hero")).toBe("home.hero");
    expect(keyFromSlug("legal.privacy")).toBeNull();
  });
});

describe("whatsappHref", () => {
  it("keeps only digits", () => expect(whatsappHref("+49 173 9018671")).toBe("https://wa.me/491739018671"));
});

describe("photoPathFor", () => {
  const ok = "hero/0b6f3c3e-8c4a-4a53-9a43-1f2d3c4b5a69.webp";
  it("accepts a uuid file in the slot's folder", () => expect(photoPathFor("hero").test(ok)).toBe(true));
  it.each([
    "steps/0b6f3c3e-8c4a-4a53-9a43-1f2d3c4b5a69.webp",
    "hero/../steps/0b6f3c3e-8c4a-4a53-9a43-1f2d3c4b5a69.webp",
    "hero/0b6f3c3e-8c4a-4a53-9a43-1f2d3c4b5a69.svg",
    "hero/evil.jpg",
    `x${ok}`,
  ])("rejects %s", (path) => expect(photoPathFor("hero").test(path)).toBe(false));
});
```

`src/features/site-content/legal-check.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hasPlaceholder, legalProblems } from "./legal-check";

const body = (de: string, en = "") => ({ body: { de, en } });

describe("hasPlaceholder", () => {
  it("finds the marker", () => expect(hasPlaceholder("Firma [PLATZHALTER: Name]")).toBe(true));
  it("ignores clean text", () => expect(hasPlaceholder("Firma GmbH")).toBe(false));
});

describe("legalProblems", () => {
  it("passes clean rows", () => {
    expect(legalProblems([{ key: "legal.imprint", value: body("A") }, { key: "legal.privacy", value: body("B", "C") }])).toEqual([]);
  });
  it("reports missing rows", () => {
    expect(legalProblems([{ key: "legal.imprint", value: body("A") }])).toEqual(["legal.privacy: missing"]);
  });
  it("reports placeholders per language", () => {
    expect(legalProblems([
      { key: "legal.imprint", value: body("A", "[PLATZHALTER: x]") },
      { key: "legal.privacy", value: body("[PLATZHALTER: y]") },
    ])).toEqual(["legal.imprint: placeholder in en", "legal.privacy: placeholder in de"]);
  });
  it("reports an empty German body", () => {
    expect(legalProblems([{ key: "legal.imprint", value: body("") }, { key: "legal.privacy", value: body("B") }])).toEqual(["legal.imprint: missing"]);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/features/site-content`
Expected: FAIL, modules `./content` and `./legal-check` not found.

- [ ] **Step 3: Implement `legal-check.ts`**

No `@/` imports: `scripts/check-legal.ts` imports this file through tsx.

```ts
/** Marker the legal drafts use for every client-specific fact. Production must not launch while one remains. */
export const PLACEHOLDER = "[PLATZHALTER";

export function hasPlaceholder(text: string): boolean {
  return text.includes(PLACEHOLDER);
}

const LEGAL_KEYS = ["legal.imprint", "legal.privacy"] as const;

/** Launch blockers in the legal rows: a missing row or empty German body, or a placeholder in either language. */
export function legalProblems(rows: { key: string; value: unknown }[]): string[] {
  const problems: string[] = [];
  for (const key of LEGAL_KEYS) {
    const value = rows.find((row) => row.key === key)?.value as { body?: { de?: unknown; en?: unknown } } | undefined;
    const de = typeof value?.body?.de === "string" ? value.body.de : "";
    const en = typeof value?.body?.en === "string" ? value.body.en : "";
    if (!de.trim()) {
      problems.push(`${key}: missing`);
      continue;
    }
    if (hasPlaceholder(de)) problems.push(`${key}: placeholder in de`);
    if (hasPlaceholder(en)) problems.push(`${key}: placeholder in en`);
  }
  return problems;
}
```

- [ ] **Step 4: Implement `content.ts`**

```ts
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
const both = (pick: (m: Messages) => string) => ({ de: pick(de as Messages), en: pick(en) });

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
```

`src/features/site-content/photo-url.ts` (separate so client components can build URLs without bundling the message files that `content.ts` imports):

```ts
import { readPublicEnv } from "@/env";

/** Public URL of a stored site photo, or null for the placeholder. */
export function photoSrc(path: string | null): string | null {
  return path ? `${readPublicEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site/${path}` : null;
}
```

If `tsc` rejects `pick(de as Messages)` because the German file's inferred type differs, use `pick(de as unknown as Messages)`; both files have the same keys (next-intl requires it).

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/features/site-content`
Expected: PASS.

- [ ] **Step 6: Typecheck and commit**

Run: `npm run typecheck && npm run lint`
Expected: clean.

```bash
git add src/features/site-content/content.ts src/features/site-content/photo-url.ts src/features/site-content/content.test.ts src/features/site-content/legal-check.ts src/features/site-content/legal-check.test.ts
git commit -m "feat(site-content): content keys, schemas, defaults and legal placeholder check

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Safe markdown renderer

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `src/ui/Markdown.tsx`, `src/ui/markdown.test.ts`
- Modify: `src/styles/components.css` (append `.prose` rules inside `@layer components`)

**Interfaces:**
- Produces: `Markdown({ children: string, className?: string })` (server- and client-safe, no directive), `safeUrl(url: string): string`.

- [ ] **Step 1: Install**

Run: `npm install react-markdown@^10 remark-gfm@^4`
Expected: both added to `dependencies`.

- [ ] **Step 2: Write the failing test**

`src/ui/markdown.test.ts` (plain `.ts`: Vitest only includes `*.test.ts`, so use `createElement`):

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown, safeUrl } from "./Markdown";

const render = (md: string) => renderToStaticMarkup(createElement(Markdown, { children: md }));

describe("Markdown", () => {
  it("renders headings, lists and tables", () => {
    const html = render("## Title\n\n- one\n\n| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<table>");
  });

  it("drops raw HTML", () => {
    const html = render('Hi <script>alert(1)</script> <img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<img");
  });

  it("neutralises javascript: links", () => {
    expect(render("[x](javascript:alert(1))")).not.toContain("javascript:");
  });

  it("keeps mailto, tel, https and relative links", () => {
    const html = render("[a](mailto:a@b.de) [b](tel:+49) [c](https://x.de) [d](/de/privacy)");
    for (const href of ["mailto:a@b.de", "tel:+49", "https://x.de", "/de/privacy"]) expect(html).toContain(`href="${href}"`);
  });
});

describe("safeUrl", () => {
  it.each(["javascript:alert(1)", "JAVASCRIPT:x", "data:text/html,x", "vbscript:x"])("blocks %s", (url) => expect(safeUrl(url)).toBe(""));
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run src/ui/markdown.test.ts`
Expected: FAIL, `./Markdown` not found.

- [ ] **Step 4: Implement `src/ui/Markdown.tsx`**

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "./cn";

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Allows http(s), mailto, tel and scheme-less (relative, #anchor) URLs; anything else becomes an empty href. */
export function safeUrl(url: string): string {
  if (!SCHEME.test(url)) return url;
  return /^(https?|mailto|tel):/i.test(url) ? url : "";
}

/** Admin-authored markdown. Raw HTML is skipped entirely, so stored text can never inject markup or script. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={safeUrl}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 5: Add `.prose` styles**

Append inside the existing `@layer components { … }` block of `src/styles/components.css`:

```css
  .prose { display: grid; gap: 16px; max-width: 72ch; color: var(--text-body); line-height: 1.65; }
  .prose h2 { font-size: var(--text-2xl); margin-top: 16px; }
  .prose h3 { font-size: var(--text-xl); margin-top: 8px; }
  .prose ul, .prose ol { display: grid; gap: 6px; padding-left: 1.25rem; }
  .prose ul { list-style: disc; }
  .prose ol { list-style: decimal; }
  .prose a { color: var(--text-accent); text-decoration: underline; }
  .prose strong { font-weight: var(--weight-semibold); }
  .prose table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
  .prose th, .prose td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border-hairline); }
```

If `--text-2xl` is not defined in `src/styles/tokens.css`, use the largest heading token that is (check with `grep -n "text-" src/styles/tokens.css`).

- [ ] **Step 6: Run tests, typecheck, commit**

Run: `npx vitest run src/ui && npm run typecheck`
Expected: PASS.

```bash
git add package.json package-lock.json src/ui/Markdown.tsx src/ui/markdown.test.ts src/styles/components.css
git commit -m "feat(ui): safe markdown renderer without raw HTML

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Legal drafts, their migration and the launch gate

**Files:**
- Create: `src/features/site-content/legal-draft.ts`, `src/features/site-content/legal-draft.test.ts`
- Create: `supabase/migrations/20261001000003_legal_drafts.sql`
- Create: `scripts/check-legal.ts`
- Modify: `package.json` (script `check:legal`)

**Interfaces:**
- Consumes: `MESSAGE_RETENTION_MONTHS`, `LEAD_RETENTION_MONTHS` from `@/features/leads/retention`; `legalProblems` from `./legal-check`.
- Produces: `LEGAL_DRAFT: Record<"legal.imprint" | "legal.privacy", { body: { de: string; en: string } }>`; `npm run check:legal`.

- [ ] **Step 1: Write the failing test**

`src/features/site-content/legal-draft.test.ts`:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEAD_RETENTION_MONTHS, MESSAGE_RETENTION_MONTHS } from "@/features/leads/retention";
import { LEGAL_DRAFT } from "./legal-draft";
import { hasPlaceholder } from "./legal-check";

const sql = readFileSync(path.join(process.cwd(), "supabase/migrations/20261001000003_legal_drafts.sql"), "utf8");
const block = (tag: string) => {
  const match = sql.match(new RegExp(`\\$${tag}\\$\\n([\\s\\S]*?)\\n\\$${tag}\\$`));
  if (!match) throw new Error(`no $${tag}$ block`);
  return match[1];
};

describe("legal drafts", () => {
  it.each([
    ["imprint_de", LEGAL_DRAFT["legal.imprint"].body.de],
    ["imprint_en", LEGAL_DRAFT["legal.imprint"].body.en],
    ["privacy_de", LEGAL_DRAFT["legal.privacy"].body.de],
    ["privacy_en", LEGAL_DRAFT["legal.privacy"].body.en],
  ])("the migration's %s equals legal-draft.ts", (tag, text) => expect(block(tag)).toBe(text));

  it("state the retention periods the code enforces", () => {
    const { de, en } = LEGAL_DRAFT["legal.privacy"].body;
    expect(de).toContain("innerhalb von 48 Stunden");
    expect(de).toContain(`${MESSAGE_RETENTION_MONTHS} Monate nach`);
    expect(de).toContain(`${LEAD_RETENTION_MONTHS} Monate nach`);
    expect(en).toContain("within 48 hours");
    expect(en).toContain(`${MESSAGE_RETENTION_MONTHS} months after`);
    expect(en).toContain(`${LEAD_RETENTION_MONTHS} months after`);
  });

  it("are marked as drafts so the launch gate blocks them", () => {
    for (const draft of Object.values(LEGAL_DRAFT)) {
      expect(hasPlaceholder(draft.body.de)).toBe(true);
      expect(hasPlaceholder(draft.body.en)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/features/site-content/legal-draft.test.ts`
Expected: FAIL, `./legal-draft` not found.

- [ ] **Step 3: Write `legal-draft.ts`**

Markdown hard line breaks use a trailing backslash. The texts are a structure for the client's lawyer, not legal advice.

```ts
import { LEAD_RETENTION_MONTHS, MESSAGE_RETENTION_MONTHS } from "@/features/leads/retention";

// Copied literally into supabase/migrations/20261001000003_legal_drafts.sql; legal-draft.test.ts keeps them equal.
// Every client-specific fact is a [PLATZHALTER: …] marker; `npm run check:legal` blocks launch while one remains.

const IMPRINT_DE = `## Angaben gemäß § 5 DDG

[PLATZHALTER: Firmenname und Rechtsform]\\
[PLATZHALTER: Straße und Hausnummer]\\
[PLATZHALTER: PLZ und Ort]

**Vertreten durch:** [PLATZHALTER: Geschäftsführer/in]

## Kontakt

Telefon: [PLATZHALTER: Telefonnummer]\\
E-Mail: [PLATZHALTER: E-Mail-Adresse]

## Registereintrag

Registergericht: [PLATZHALTER: Amtsgericht]\\
Registernummer: [PLATZHALTER: HRB-Nummer]

## Umsatzsteuer-ID

Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [PLATZHALTER: USt-IdNr.]

## Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV

[PLATZHALTER: Name und Anschrift]

## Verbraucherstreitbeilegung

[PLATZHALTER: Hinweis nach § 36 VSBG anwaltlich prüfen lassen]`;

const IMPRINT_EN = `## Information pursuant to § 5 DDG

[PLATZHALTER: company name and legal form]\\
[PLATZHALTER: street and number]\\
[PLATZHALTER: postcode and city]

**Represented by:** [PLATZHALTER: managing director]

## Contact

Phone: [PLATZHALTER: phone number]\\
Email: [PLATZHALTER: email address]

## Register entry

Register court: [PLATZHALTER: local court]\\
Register number: [PLATZHALTER: HRB number]

## VAT ID

VAT identification number pursuant to § 27a UStG: [PLATZHALTER: VAT ID]

## Responsible for content pursuant to § 18(2) MStV

[PLATZHALTER: name and address]

## Consumer dispute resolution

[PLATZHALTER: statement under § 36 VSBG, to be checked by a lawyer]

The German version of this page is legally binding.`;

const PRIVACY_DE = `## 1. Verantwortlicher

[PLATZHALTER: Firmenname, Anschrift, E-Mail, Telefon]

## 2. Welche Daten wir verarbeiten

**Bewerbungen.** Wenn Sie sich über unser Bewerbungsformular bewerben, verarbeiten wir Ihren Namen, Ihre E-Mail-Adresse, Ihre Telefonnummer, Ihre Antworten im Formular und die hochgeladenen Unterlagen, um Ihre Bewerbung zu prüfen und Ihnen passende Stellen zu vermitteln (Art. 6 Abs. 1 lit. b DSGVO).

**Arbeitgeberanfragen und Kontaktnachrichten.** Wenn Sie uns über das Anfrage- oder Kontaktformular schreiben, verarbeiten wir Ihre Angaben, um Ihre Anfrage zu beantworten (Art. 6 Abs. 1 lit. b DSGVO, bei allgemeinen Anfragen Art. 6 Abs. 1 lit. f DSGVO).

**Missbrauchsschutz.** Damit unsere Formulare nicht massenhaft missbraucht werden, zählen wir Absendungen pro IP-Adresse. Diese Zähler werden nach etwa einem Tag gelöscht (Art. 6 Abs. 1 lit. f DSGVO).

**Server-Logdateien.** Beim Aufruf der Website verarbeitet unser Hosting-Anbieter technisch notwendige Daten wie IP-Adresse, Zeitpunkt und aufgerufene Seite, um die Website sicher bereitzustellen (Art. 6 Abs. 1 lit. f DSGVO).

## 3. Speicherdauer

- Begonnene, aber nicht abgesendete Bewerbungen und ihre Dateien löschen wir automatisch innerhalb von 48 Stunden.
- Kontaktnachrichten löschen wir automatisch ${MESSAGE_RETENTION_MONTHS} Monate nach der letzten Bearbeitung.
- Abgeschlossene oder archivierte Arbeitgeberanfragen löschen wir automatisch ${LEAD_RETENTION_MONTHS} Monate nach der letzten Bearbeitung.
- Abgesendete Bewerbungen: [PLATZHALTER: Speicherdauer festlegen]

## 4. Empfänger und Auftragsverarbeiter

- **Supabase** (Datenbank, Dateispeicher, Anmeldung für unser Team), Serverstandort in der EU [PLATZHALTER: Region bestätigen].
- **Vercel** (Hosting der Website). [PLATZHALTER: Drittlandübermittlung und Garantien, z. B. EU-US Data Privacy Framework]
- **Resend** (E-Mail-Benachrichtigungen an unser Team über neue Anfragen; die E-Mails enthalten keine Angaben aus dem Formular außer dem Firmennamen).
- **WhatsApp** (Meta Platforms Ireland Ltd.), nur wenn Sie uns über den WhatsApp-Link schreiben.
- **tawk.to** (Live-Chat), nur nach Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
- **CookieScript** (Verwaltung Ihrer Cookie-Einwilligung).

[PLATZHALTER: nicht genutzte Dienste entfernen]

## 5. Cookies und Einwilligung

Technisch notwendige Cookies setzen wir ohne Einwilligung. Den Live-Chat laden wir erst, wenn Sie in den Cookie-Einstellungen zugestimmt haben. Ihre Einwilligung können Sie jederzeit über „Cookie-Einstellungen" im Fußbereich der Seite widerrufen.

## 6. Ihre Rechte

Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, eine Einwilligung jederzeit zu widerrufen. Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei [PLATZHALTER: zuständige Landesdatenschutzbehörde].

## 7. Stand

[PLATZHALTER: Datum]`;

const PRIVACY_EN = `## 1. Controller

[PLATZHALTER: company name, address, email, phone]

## 2. What data we process

**Applications.** When you apply through our application form, we process your name, email address, phone number, your answers and the documents you upload to review your application and place you in suitable jobs (Art. 6(1)(b) GDPR).

**Employer enquiries and contact messages.** When you write to us through the enquiry or contact form, we process your details to answer you (Art. 6(1)(b) GDPR, for general questions Art. 6(1)(f) GDPR).

**Abuse protection.** To stop our forms being misused, we count submissions per IP address. These counters are deleted after about one day (Art. 6(1)(f) GDPR).

**Server log files.** When you visit the website, our hosting provider processes technically necessary data such as IP address, time and page requested to deliver the website securely (Art. 6(1)(f) GDPR).

## 3. How long we keep data

- Applications that were started but not sent, and their files, are deleted automatically within 48 hours.
- Contact messages are deleted automatically ${MESSAGE_RETENTION_MONTHS} months after they were last edited.
- Closed or archived employer enquiries are deleted automatically ${LEAD_RETENTION_MONTHS} months after they were last edited.
- Submitted applications: [PLATZHALTER: retention period]

## 4. Recipients and processors

- **Supabase** (database, file storage, sign-in for our team), servers in the EU [PLATZHALTER: confirm region].
- **Vercel** (website hosting). [PLATZHALTER: third-country transfer and safeguards, e.g. EU-US Data Privacy Framework]
- **Resend** (email notifications to our team about new enquiries; the emails contain no form data except the company name).
- **WhatsApp** (Meta Platforms Ireland Ltd.), only if you message us through the WhatsApp link.
- **tawk.to** (live chat), only after your consent (Art. 6(1)(a) GDPR).
- **CookieScript** (management of your cookie consent).

[PLATZHALTER: remove services that are not used]

## 5. Cookies and consent

We set technically necessary cookies without consent. The live chat only loads after you agree in the cookie settings. You can withdraw your consent at any time through "Cookie settings" in the page footer.

## 6. Your rights

You have the right to access, rectification, erasure, restriction of processing, data portability and objection, and to withdraw consent at any time. You can also complain to a data protection supervisory authority, for example [PLATZHALTER: competent state authority].

## 7. Last updated

[PLATZHALTER: date]

The German version of this page is legally binding.`;

export const LEGAL_DRAFT = {
  "legal.imprint": { body: { de: IMPRINT_DE, en: IMPRINT_EN } },
  "legal.privacy": { body: { de: PRIVACY_DE, en: PRIVACY_EN } },
};
```

- [ ] **Step 4: Write the migration**

`supabase/migrations/20261001000003_legal_drafts.sql`. Each `$tag$` block holds the evaluated text of the matching constant. Write it by printing the constants rather than by hand:

```bash
npx tsx -e '
import { LEGAL_DRAFT as d } from "./src/features/site-content/legal-draft.ts";
const q = (tag: string, s: string) => `$${tag}$\n${s}\n$${tag}$`;
console.log(`-- Draft legal texts (2d). Generated from src/features/site-content/legal-draft.ts; legal-draft.test.ts keeps them equal.
-- In the migration, not seed.sql, because production runs db push without the seed. Never overwrites an edited row.
insert into public.site_content (key, value) values
  (\x27legal.imprint\x27, jsonb_build_object(\x27body\x27, jsonb_build_object(
    \x27de\x27, ${q("imprint_de", d["legal.imprint"].body.de)},
    \x27en\x27, ${q("imprint_en", d["legal.imprint"].body.en)}))),
  (\x27legal.privacy\x27, jsonb_build_object(\x27body\x27, jsonb_build_object(
    \x27de\x27, ${q("privacy_de", d["legal.privacy"].body.de)},
    \x27en\x27, ${q("privacy_en", d["legal.privacy"].body.en)})))
on conflict (key) do nothing;`);
' > supabase/migrations/20261001000003_legal_drafts.sql
```

If `tsx -e` cannot resolve the `@/` import inside `legal-draft.ts`, run the same code from a temporary file in the scratchpad with `npx tsx --tsconfig tsconfig.json <file>`, then delete the file. Open the result and check it reads as plain SQL with four dollar-quoted blocks.

- [ ] **Step 5: Run the tests and apply**

Run: `npx vitest run src/features/site-content && npx supabase db reset && npx supabase test db`
Expected: all pass. Then `npx supabase db reset` again must also pass (the insert is idempotent through `on conflict`).

- [ ] **Step 6: Write the launch gate script**

`scripts/check-legal.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import { legalProblems } from "../src/features/site-content/legal-check";

// Launch gate: fails while Impressum or Datenschutzerklärung is missing or still contains [PLATZHALTER markers.
// Uses NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from the environment (falls back to .env.local).
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // No .env.local: the check below reports the missing variables.
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await supabase.from("site_content").select("key, value").like("key", "legal.%");
if (error) {
  console.error("reading site_content failed:", error.code);
  process.exit(1);
}

const problems = legalProblems(data);
if (problems.length > 0) {
  console.error(`Legal pages are not ready (${new URL(url).host}):\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`Legal pages are ready (${new URL(url).host}).`);
```

Add to `package.json` scripts: `"check:legal": "tsx scripts/check-legal.ts"`.

- [ ] **Step 7: Run the gate against the local drafts**

Run: `npm run check:legal; echo "exit=$?"`
Expected: lists four `placeholder in de/en` problems and `exit=1`.

- [ ] **Step 8: Commit**

```bash
git add src/features/site-content/legal-draft.ts src/features/site-content/legal-draft.test.ts supabase/migrations/20261001000003_legal_drafts.sql scripts/check-legal.ts package.json
git commit -m "feat(site-content): draft Impressum and privacy policy with a launch gate

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Public site reads `site_content`

**Files:**
- Create: `src/features/site-content/queries.ts`
- Modify: `src/features/site/photos.ts`, `src/features/site/Photo.tsx`, `src/app/[locale]/(site)/page.tsx`, `src/features/site/SiteFooter.tsx`, `src/features/site/WhatsAppButton.tsx`, `src/features/site/ChatChannel.tsx`, `src/features/site/TawkChat.tsx`, `src/app/[locale]/(site)/contact/page.tsx`, `src/features/leads/LeadForm.tsx`, `src/features/leads/ContactForm.tsx`, `next.config.ts`, `src/i18n/messages/{de,en}.json`
- Delete: `src/features/site/contact.ts`, `src/features/site/photos.test.ts`

**Interfaces:**
- Consumes: `resolveContent`, `defaults`, `photoSrc`, `whatsappHref`, `SiteContent`, `ContentKey` (Task 2).
- Produces: `getSiteContent(): Promise<SiteContent>` (React `cache`d), `getContentMeta(): Promise<Partial<Record<ContentKey, string>>>` (key → `updated_at`), `Photo({ src: string | null, alt, className?, sizes?, priority? })`, `TawkChat({ propertyId, widgetId, whatsappUrl })`.

- [ ] **Step 1: Write `queries.ts`**

```ts
import "server-only";
import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { CONTENT_KEYS, defaults, resolveContent, type ContentKey, type SiteContent } from "./content";

/** Every public page reads this. A failed read logs and renders the defaults instead of breaking the site. */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("site_content").select("key, value");
  if (error) {
    console.error("read site_content failed", error.code);
    return defaults;
  }
  return resolveContent(data, (key) => console.error("invalid site_content value", key));
});

/** When each stored key was last edited; keys without a row are absent (they show the default). */
export async function getContentMeta(): Promise<Partial<Record<ContentKey, string>>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("site_content").select("key, updated_at");
  if (error) {
    console.error("read site_content meta failed", error.code);
    return {};
  }
  const meta: Partial<Record<ContentKey, string>> = {};
  for (const row of data) if ((CONTENT_KEYS as readonly string[]).includes(row.key)) meta[row.key as ContentKey] = row.updated_at;
  return meta;
}
```

- [ ] **Step 2: Photo takes a URL**

`src/features/site/photos.ts`:

```ts
/** Photo slots on the public site. Admins upload a photo per slot under Admin → Content → Photos. */
export const PHOTO_SLOTS = ["hero", "feature-match", "feature-advisors", "steps", "employer-banner"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];
```

Delete `src/features/site/photos.test.ts` (it only tested the removed `PHOTOS` map).

`src/features/site/Photo.tsx`:

```tsx
import Image from "next/image";
import { Icon } from "@/ui/Icon";
import { cn } from "@/ui/cn";

type Props = { src: string | null; alt: string; className?: string; sizes?: string; priority?: boolean };

/** Rounded photo; a tinted placeholder while no photo is uploaded for the slot. Size it with an aspect-* class. */
export function Photo({ src, alt, className, sizes = "(min-width: 860px) 50vw, 100vw", priority }: Props) {
  return (
    <div className={cn("photo", !src && "photo-ph", className)}>
      {src ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} /> : <Icon name="user" size={36} />}
    </div>
  );
}
```

- [ ] **Step 3: Allow Supabase storage images**

Read `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` sections `remotePatterns` and `dangerouslyAllowLocalIP` first. Next 16 refuses to optimise images from local IPs, and the local Supabase is `127.0.0.1:54321`.

`next.config.ts`:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321");
const isLocalSupabase = supabase.hostname === "127.0.0.1" || supabase.hostname === "localhost";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: supabase.protocol === "http:" ? "http" : "https",
        hostname: supabase.hostname,
        port: supabase.port,
        pathname: "/storage/v1/object/public/site/**",
      },
    ],
    // Only the local Supabase CLI stack lives on a local IP; production Supabase is a public https host.
    dangerouslyAllowLocalIP: isLocalSupabase,
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 4: Home page reads content**

In `src/app/[locale]/(site)/page.tsx`:
- Replace the `WHATSAPP_URL` import with `import { getSiteContent } from "@/features/site-content/queries";` and `import { photoSrc, whatsappHref } from "@/features/site-content/content";`.
- Add `getSiteContent()` to the `Promise.all` as `content`, and after it: `const L = (value: LocalizedText) => localized(value, locale);` (import `type LocalizedText` from `@/lib/i18n/localized`), `const { photos } = content;`, `const hero = content["home.hero"]; const features = content["home.features"]; const steps = content["home.steps"]; const employers = content["home.employers"];`.
- Replace text and photos:

| Before | After |
|---|---|
| `t("kicker")`, `t("title")`, `t("lead")` | `L(hero.kicker)`, `L(hero.title)`, `L(hero.lead)` |
| `href={WHATSAPP_URL}` | `href={whatsappHref(content.contact.whatsapp)}` |
| `<Photo slot="hero" alt={t("heroAlt")} …` | `<Photo src={photoSrc(photos.hero.path)} alt={L(photos.hero.alt)} …` |
| `<Photo slot={f.slot} alt={t(\`features.${f.key}.alt\`)} …` | `<Photo src={photoSrc(photos[f.slot].path)} alt={L(photos[f.slot].alt)} …` |
| `t("features.advisors.badgeTitle")` / `badgeText` | `L(features.advisors.badgeTitle)` / `L(features.advisors.badgeText)` |
| `t(\`features.${f.key}.eyebrow\`)` / `.title` / `.text` | `L(features[f.key].eyebrow)` / `L(features[f.key].title)` / `L(features[f.key].text)` |
| `t("stepsKicker")`, `t("stepsTitle")` | `L(steps.kicker)`, `L(steps.title)` |
| `t(\`steps.${step}.title\`)` / `.text` | `L(steps[step].title)` / `L(steps[step].text)` |
| `<Photo slot="steps" alt={t("stepsAlt")} …` | `<Photo src={photoSrc(photos.steps.path)} alt={L(photos.steps.alt)} …` |
| `<Photo slot="employer-banner" alt="" …` | `<Photo src={photoSrc(photos["employer-banner"].path)} alt={L(photos["employer-banner"].alt)} …` |
| `t("doors.employerKicker")` / `Title` / `Text` | `L(employers.kicker)` / `L(employers.title)` / `L(employers.text)` |

`localized()` returns `value.de` for an empty `en`, and `""` never occurs for `de` except the decorative banner alt, which is correct as `alt=""`.

- [ ] **Step 5: Contact details**

- `src/features/site/WhatsAppButton.tsx`: `const [t, content] = await Promise.all([getTranslations("site"), getSiteContent()]);`, `href={whatsappHref(content.contact.whatsapp)}`, `aria-label={t("whatsappLabel", { number: content.contact.whatsapp })}`.
- `src/features/site/ChatChannel.tsx`: read `getSiteContent()` alongside the provider and pass `whatsappUrl={whatsappHref(content.contact.whatsapp)}` to `<TawkChat>`.
- `src/features/site/TawkChat.tsx`: remove the `./contact` import; add `whatsappUrl: string` to the props and use it in place of `WHATSAPP_URL`.
- `src/app/[locale]/(site)/contact/page.tsx`: read `getSiteContent()`; `href={whatsappHref(contact.whatsapp)}` and `{tSite("whatsapp")}: {contact.whatsapp}`.
- `src/features/site/SiteFooter.tsx`: read `getSiteContent()`; the contact column becomes:

```tsx
          <div className="footer-col">
            <h4>{t("footerContact")}</h4>
            <a href={whatsappHref(contact.whatsapp)} className="inline-flex items-center gap-2" target="_blank" rel="noopener noreferrer">
              <Icon name="message-circle" size={16} />
              {t("whatsapp")}: {contact.whatsapp}
            </a>
            {contact.email ? (
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2">
                <Icon name="mail" size={16} />
                {contact.email}
              </a>
            ) : null}
            {contact.address ? (
              <address className="inline-flex items-start gap-2 whitespace-pre-line not-italic">
                <Icon name="map-pin" size={16} className="mt-1" />
                {contact.address}
              </address>
            ) : null}
          </div>
```

- Delete `src/features/site/contact.ts`. Run `grep -rn "site/contact\|\./contact\"" src` and expect no hits.

- [ ] **Step 6: Messages**

In both message files:
- `site.whatsappLabel`: en `"Message us on WhatsApp: {number}"`, de `"Per WhatsApp schreiben: {number}"`.
- `employers.privacy`: en `"We use your details only to answer your enquiry. More in our <link>privacy policy</link>."`, de `"Wir verwenden Ihre Angaben nur, um Ihre Anfrage zu beantworten. Mehr in unserer <link>Datenschutzerklärung</link>."`
- `contact.privacy`: en `"We use your details only to answer your message. More in our <link>privacy policy</link>."`, de `"Wir verwenden Ihre Angaben nur, um Ihre Nachricht zu beantworten. Mehr in unserer <link>Datenschutzerklärung</link>."`

In `LeadForm.tsx` and `ContactForm.tsx` replace `{t("privacy")}` with
`{t.rich("privacy", { link: (chunks) => <Link href="/privacy" className="underline">{chunks}</Link> })}` and import `Link` from `@/i18n/navigation`. (The `/privacy` page arrives in Task 6.)

The moved home strings stay in `messages/*.json`: they are the source of `defaults`.

- [ ] **Step 7: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Expected: clean. Then `npm run dev`, open `http://localhost:3000/de` and `/en`: the page looks exactly as before (placeholders for photos, same copy, WhatsApp number in footer).

- [ ] **Step 8: Commit**

```bash
git add -A src/features/site src/features/site-content/queries.ts "src/app/[locale]/(site)" src/features/leads/LeadForm.tsx src/features/leads/ContactForm.tsx next.config.ts src/i18n/messages
git commit -m "feat(site): read home copy, contact details and photos from site_content

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Public legal pages and footer links

**Files:**
- Create: `src/features/site-content/LegalArticle.tsx`
- Create: `src/app/[locale]/(site)/imprint/page.tsx`, `src/app/[locale]/(site)/privacy/page.tsx`
- Modify: `src/features/site/SiteFooter.tsx`, `src/i18n/messages/{de,en}.json`

**Interfaces:**
- Consumes: `getSiteContent` (Task 5), `Markdown` (Task 3), `LegalKey` (Task 2).
- Produces: `LegalArticle({ contentKey: LegalKey, locale: Locale, title: string })`; routes `/[locale]/imprint`, `/[locale]/privacy`.

- [ ] **Step 1: Messages**

Add to `site` in en: `"imprint": "Imprint"`, `"privacy": "Privacy policy"`, `"germanOnly": "This page is only available in German."`; in de: `"imprint": "Impressum"`, `"privacy": "Datenschutz"`, `"germanOnly": "Diese Seite ist nur auf Deutsch verfügbar."`.

- [ ] **Step 2: `LegalArticle.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Markdown } from "@/ui/Markdown";
import type { LegalKey } from "./content";
import { getSiteContent } from "./queries";

/** Impressum / privacy policy. Without an English text, /en shows the German one, marked as German. */
export async function LegalArticle({ contentKey, locale, title }: { contentKey: LegalKey; locale: Locale; title: string }) {
  const [t, content] = await Promise.all([getTranslations("site"), getSiteContent()]);
  const { de, en } = content[contentKey].body;
  const germanFallback = locale === "en" && !en.trim();

  return (
    <article className="container-page grid gap-8 py-14 md:py-20">
      <h1>{title}</h1>
      {germanFallback ? <p className="notice notice-info">{t("germanOnly")}</p> : null}
      <div lang={germanFallback ? "de" : undefined}>
        <Markdown>{locale === "de" || germanFallback ? de : en}</Markdown>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: The two pages**

`src/app/[locale]/(site)/imprint/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { LegalArticle } from "@/features/site-content/LegalArticle";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  return { title: t("imprint") };
}

export default async function ImprintPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site");
  return <LegalArticle contentKey="legal.imprint" locale={locale} title={t("imprint")} />;
}
```

`src/app/[locale]/(site)/privacy/page.tsx`: the same with `PrivacyPage`, `t("privacy")` and `contentKey="legal.privacy"`.

- [ ] **Step 4: Footer legal nav**

In `SiteFooter.tsx` replace the `footer-legal` block with:

```tsx
        <div className="footer-legal">
          <span>{t("rights", { year: new Date().getFullYear() })}</span>
          <nav aria-label={t("legalLabel")} className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/imprint">{t("imprint")}</Link>
            <Link href="/privacy">{t("privacy")}</Link>
            {cookieSettings ? <CookieSettingsButton /> : null}
          </nav>
        </div>
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint`, then with `npm run dev` open `/de/imprint`, `/en/imprint`, `/de/privacy`, `/en/privacy`.
Expected: headings and lists render; `[PLATZHALTER: …]` markers visible; footer shows Impressum · Datenschutz (de) / Imprint · Privacy policy (en); the form privacy notes on `/en/contact` and `/en/employers` link to `/en/privacy`.

- [ ] **Step 6: Commit**

```bash
git add src/features/site-content/LegalArticle.tsx "src/app/[locale]/(site)/imprint" "src/app/[locale]/(site)/privacy" src/features/site/SiteFooter.tsx src/i18n/messages
git commit -m "feat(site): Impressum and privacy policy pages linked from the footer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Admin overview, text sections and contact editor

**Files:**
- Create: `src/features/site-content/sections.ts`, `src/features/site-content/form-data.ts`, `src/features/site-content/form-data.test.ts`
- Create: `src/features/site-content/admin-actions.ts`
- Create: `src/features/site-content/SectionForm.tsx`, `src/features/site-content/ResetSectionForm.tsx`
- Create: `src/app/[locale]/admin/(protected)/content/page.tsx`, `src/app/[locale]/admin/(protected)/content/[section]/page.tsx`
- Modify: `src/app/[locale]/admin/(protected)/layout.tsx`, `src/i18n/messages/{de,en}.json`

**Interfaces:**
- Consumes: Task 2 (`contentSchemas`, `keyFromSlug`, `isLegalKey`, `isTextKey`, `SECTION_SLUGS`, `TextKey`, `SiteContent`), Task 5 (`getSiteContent`, `getContentMeta`), `requireAdmin`/`requireOwner`/`getAdminSession`, `ActionResult`, `fail`, `ok`.
- Produces:
  - `sections.ts`: `type FieldSpec = { path: string; label: string; long?: boolean; localized: boolean }`, `type FieldGroup = { group?: string; fields: FieldSpec[] }`, `SECTION_FIELDS: Record<TextKey, FieldGroup[]>`, `getAt(value: unknown, path: string): unknown`
  - `form-data.ts`: `unflatten(formData: FormData): Record<string, unknown>`, `fieldErrorsByPath(issues): FieldErrors`, `parseSectionForm(key: ContentKey, formData: FormData): { success: true; data: unknown } | { success: false; fieldErrors: FieldErrors }`
  - `admin-actions.ts`: `saveSiteContent(prev, formData)`, `resetSiteContent(prev, formData)`; form fields `locale`, `section` (slug) plus content fields named by dotted path with `.de` / `.en` suffix for translated text (e.g. `match.title.de`, `whatsapp`, `body.en`).

- [ ] **Step 1: Write the failing test**

`src/features/site-content/form-data.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseSectionForm, unflatten } from "./form-data";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(entries)) data.append(k, v);
  return data;
};

describe("unflatten", () => {
  it("nests dotted names", () => {
    expect(unflatten(form({ "match.title.de": "T", "match.title.en": "", whatsapp: "1" }))).toEqual({
      match: { title: { de: "T", en: "" } },
      whatsapp: "1",
    });
  });
  it("ignores control fields and unsafe names", () => {
    expect(unflatten(form({ locale: "de", section: "hero", "__proto__.x": "1", "a..b": "2", $ACTION_ID_1: "" }))).toEqual({});
  });
});

describe("parseSectionForm", () => {
  it("parses the hero", () => {
    const result = parseSectionForm("home.hero", form({
      "kicker.de": " K ", "kicker.en": "", "title.de": "T", "title.en": "Title", "lead.de": "L", "lead.en": "",
    }));
    expect(result).toEqual({ success: true, data: { kicker: { de: "K", en: "" }, title: { de: "T", en: "Title" }, lead: { de: "L", en: "" } } });
  });

  it("reports the full field path", () => {
    const result = parseSectionForm("home.features", form({
      "match.eyebrow.de": "E", "match.title.de": "", "match.text.de": "X",
      "advisors.eyebrow.de": "E", "advisors.title.de": "T", "advisors.text.de": "X", "advisors.badgeTitle.de": "B", "advisors.badgeText.de": "B",
    }));
    expect(result).toEqual({ success: false, fieldErrors: { "match.title.de": ["invalid"] } });
  });

  it("parses contact details", () => {
    const result = parseSectionForm("contact", form({ whatsapp: "+49 30 1234567", email: "", address: "Str. 1\n10115 Berlin" }));
    expect(result).toEqual({ success: true, data: { whatsapp: "+49 30 1234567", email: "", address: "Str. 1\n10115 Berlin" } });
  });

  it("parses a legal body", () => {
    expect(parseSectionForm("legal.privacy", form({ "body.de": "## A", "body.en": "" }))).toEqual({ success: true, data: { body: { de: "## A", en: "" } } });
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/features/site-content/form-data.test.ts`
Expected: FAIL, `./form-data` not found.

- [ ] **Step 3: Implement `form-data.ts`**

```ts
import type { FieldErrors } from "@/lib/result";
import { contentSchemas, type ContentKey } from "./content";

const SEGMENT = /^[A-Za-z][A-Za-z0-9-]*$/;
const CONTROL = new Set(["locale", "section"]);

/** `match.title.de=…` → `{ match: { title: { de: … } } }`. Only plain identifier segments; everything else is ignored. */
export function unflatten(formData: FormData): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const [name, value] of formData.entries()) {
    if (typeof value !== "string" || CONTROL.has(name)) continue;
    const segments = name.split(".");
    if (!segments.every((s) => SEGMENT.test(s))) continue;
    let node = root;
    for (const segment of segments.slice(0, -1)) {
      const next = node[segment];
      node = (typeof next === "object" && next !== null ? next : (node[segment] = {})) as Record<string, unknown>;
    }
    node[segments[segments.length - 1]] = value;
  }
  return root;
}

/** Field errors keyed by the input's dotted name, so each translated input can show its own error. */
export function fieldErrorsByPath(issues: readonly { path: readonly PropertyKey[] }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) errors[issue.path.map(String).join(".")] = ["invalid"];
  return errors;
}

export function parseSectionForm(key: ContentKey, formData: FormData) {
  const parsed = contentSchemas[key].safeParse(unflatten(formData));
  return parsed.success
    ? ({ success: true, data: parsed.data } as const)
    : ({ success: false, fieldErrors: fieldErrorsByPath(parsed.error.issues) } as const);
}
```

`__proto__` fails `SEGMENT` (starts with `_`), so prototype pollution is impossible.

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/features/site-content/form-data.test.ts`
Expected: PASS.

- [ ] **Step 5: `sections.ts`**

```ts
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
```

- [ ] **Step 6: `admin-actions.ts` (save/reset)**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { locales, type Locale } from "@/i18n/config";
import { requireAdmin, requireOwner, type AdminSession } from "@/features/admin-auth/session";
import { fail, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import { isLegalKey, isTextKey, keyFromSlug, type ContentKey } from "./content";
import { parseSectionForm } from "./form-data";

type Result = ActionResult<null>;

const localeOf = (formData: FormData) => z.enum(locales).catch("en").parse(formData.get("locale"));

/** Legal pages are owner-only; everything else is open to all admins. Runs before any other input is used. */
async function authorize(locale: Locale, formData: FormData): Promise<{ session: AdminSession; key: ContentKey } | null> {
  const slug = formData.get("section");
  const key = typeof slug === "string" ? keyFromSlug(slug) : null;
  const session = key && isLegalKey(key) ? await requireOwner(locale) : await requireAdmin(locale);
  return key ? { session, key } : null;
}

export async function saveSiteContent(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  const auth = await authorize(locale, formData);
  if (!auth || !(isTextKey(auth.key) || isLegalKey(auth.key))) return fail("invalid");
  const parsed = parseSectionForm(auth.key, formData);
  if (!parsed.success) return fail("invalid", parsed.fieldErrors);

  // The admin's session keeps RLS in force; select() reveals a write that RLS silently filtered.
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("site_content")
    .upsert({ key: auth.key, value: parsed.data, updated_by: auth.session.userId }, { onConflict: "key" })
    .select("key");
  if (error || data.length === 0) {
    console.error("save site_content failed", error?.code ?? "no row written");
    return fail("server_error");
  }
  revalidatePath("/", "layout");
  return ok(null);
}

/** Deletes the row so the default copy shows again. Not offered for legal pages or photos. */
export async function resetSiteContent(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  const auth = await authorize(locale, formData);
  if (!auth || !isTextKey(auth.key)) return fail("invalid");

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("site_content").delete().eq("key", auth.key);
  if (error) {
    console.error("reset site_content failed", error.code);
    return fail("server_error");
  }
  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/content`);
}
```

The `value` column is typed `Json`; if `tsc` rejects `parsed.data` (`unknown`), cast with `parsed.data as Json` (import `type Json` from `@/lib/supabase/database.types`).

- [ ] **Step 7: Messages (`admin`)**

Add `admin.navContent`: en `"Content"`, de `"Inhalte"`. Add `admin.content` (en / de):

```json
"content": {
  "title": "Site content",
  "sections": { "hero": "Hero", "features": "Features", "steps": "How it works", "employers": "Employers section", "contact": "Contact details", "photos": "Photos", "imprint": "Imprint", "privacy": "Privacy policy" },
  "default": "Default",
  "edited": "Edited · {date}",
  "edit": "Edit",
  "ownerOnly": "Only the owner can edit this page.",
  "placeholders": "Contains placeholders",
  "placeholderWarning": "This text still contains [PLATZHALTER] markers. Replace all of them before the site goes live.",
  "reset": "Reset to default",
  "resetConfirm": "Replace this section with the default text?",
  "german": "German",
  "english": "English",
  "englishHelp": "Optional. Empty fields show the German text.",
  "write": "Write",
  "preview": "Preview",
  "markdownHelp": "Markdown: ## heading, **bold**, - list item, [link text](https://…). A line ending in \\ breaks the line.",
  "fields": { "kicker": "Kicker", "title": "Title", "lead": "Intro", "eyebrow": "Kicker", "text": "Text", "badgeTitle": "Badge title", "badgeText": "Badge text", "whatsapp": "WhatsApp number", "email": "Email (optional)", "address": "Address (optional)", "alt": "Alt text", "body": "Text" },
  "groups": { "match": "Block 1: Matching", "advisors": "Block 2: Personal support", "choose": "Step 1", "apply": "Step 2", "contact": "Step 3" },
  "slots": { "hero": "Hero", "feature-match": "Block 1", "feature-advisors": "Block 2", "steps": "How it works", "employer-banner": "Employer banner" },
  "noPhoto": "No photo yet. A placeholder is shown.",
  "photoHelp": "JPEG, PNG or WebP, up to 5 MB.",
  "photoUpload": "Upload photo",
  "photoReplace": "Replace photo",
  "photoRemove": "Remove photo",
  "photoRemoveConfirm": "Remove this photo from the website?",
  "uploading": "Uploading…",
  "saveAlts": "Save alt texts",
  "altHelp": "Describe the photo for screen readers. Leave empty for a purely decorative photo."
}
```

```json
"content": {
  "title": "Website-Inhalte",
  "sections": { "hero": "Startbereich", "features": "Vorteile", "steps": "Ablauf", "employers": "Arbeitgeber-Bereich", "contact": "Kontaktdaten", "photos": "Fotos", "imprint": "Impressum", "privacy": "Datenschutzerklärung" },
  "default": "Standard",
  "edited": "Bearbeitet · {date}",
  "edit": "Bearbeiten",
  "ownerOnly": "Nur der Inhaber kann diese Seite bearbeiten.",
  "placeholders": "Enthält Platzhalter",
  "placeholderWarning": "Dieser Text enthält noch [PLATZHALTER]-Markierungen. Ersetzen Sie alle, bevor die Website live geht.",
  "reset": "Auf Standard zurücksetzen",
  "resetConfirm": "Diesen Bereich durch den Standardtext ersetzen?",
  "german": "Deutsch",
  "english": "Englisch",
  "englishHelp": "Optional. Leere Felder zeigen den deutschen Text.",
  "write": "Schreiben",
  "preview": "Vorschau",
  "markdownHelp": "Markdown: ## Überschrift, **fett**, - Listenpunkt, [Linktext](https://…). Ein \\ am Zeilenende bricht die Zeile um.",
  "fields": { "kicker": "Dachzeile", "title": "Titel", "lead": "Einleitung", "eyebrow": "Dachzeile", "text": "Text", "badgeTitle": "Badge-Titel", "badgeText": "Badge-Text", "whatsapp": "WhatsApp-Nummer", "email": "E-Mail (optional)", "address": "Adresse (optional)", "alt": "Alternativtext", "body": "Text" },
  "groups": { "match": "Block 1: Vermittlung", "advisors": "Block 2: Persönliche Betreuung", "choose": "Schritt 1", "apply": "Schritt 2", "contact": "Schritt 3" },
  "slots": { "hero": "Startbereich", "feature-match": "Block 1", "feature-advisors": "Block 2", "steps": "Ablauf", "employer-banner": "Arbeitgeber-Banner" },
  "noPhoto": "Noch kein Foto. Es wird ein Platzhalter gezeigt.",
  "photoHelp": "JPEG, PNG oder WebP, bis 5 MB.",
  "photoUpload": "Foto hochladen",
  "photoReplace": "Foto ersetzen",
  "photoRemove": "Foto entfernen",
  "photoRemoveConfirm": "Dieses Foto von der Website entfernen?",
  "uploading": "Wird hochgeladen…",
  "saveAlts": "Alternativtexte speichern",
  "altHelp": "Beschreiben Sie das Foto für Screenreader. Bei rein dekorativen Fotos leer lassen."
}
```

Add `admin.errors.upload_failed`: en `"The upload failed. Check the file type and size."`, de `"Das Hochladen ist fehlgeschlagen. Prüfen Sie Dateityp und -größe."`

- [ ] **Step 8: `SectionForm.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { saveSiteContent } from "./admin-actions";
import { getAt, type FieldGroup, type FieldSpec } from "./sections";

type Props = { locale: Locale; section: string; groups: FieldGroup[]; values: unknown };

export function SectionForm({ locale, section, groups, values }: Props) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(saveSiteContent, null);
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const errorsFor = (name: string) => fieldErrors[name]?.map((code) => t(`fieldErrors.${code}`));

  const input = (spec: FieldSpec, name: string, label: string, required: boolean) => {
    const id = `content-${name.replaceAll(".", "-")}`;
    const props = { id, name, defaultValue: String(getAt(values, name) ?? ""), required, invalid: Boolean(fieldErrors[name]) };
    return (
      <Field key={name} id={id} label={label} required={required} errors={errorsFor(name)}>
        {spec.long ? <Textarea rows={4} {...props} /> : <Input {...props} />}
      </Field>
    );
  };

  return (
    <form
      onSubmit={(event) => {
        // Submit manually: a form `action` would reset the inputs after a failed save.
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <Stack gap="lg">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="section" value={section} />
        {groups.map((group, index) => (
          <fieldset key={group.group ?? index} className="grid gap-4">
            {group.group ? <legend className="card-title mb-2">{t(`content.groups.${group.group}`)}</legend> : null}
            {group.fields.map((spec) => {
              const label = t(`content.fields.${spec.label}`);
              if (!spec.localized) return input(spec, spec.path, label, spec.path === "whatsapp");
              return (
                <div key={spec.path} className="grid gap-4 md:grid-cols-2">
                  {input(spec, `${spec.path}.de`, `${label} (DE)`, true)}
                  {input(spec, `${spec.path}.en`, `${label} (EN)`, false)}
                </div>
              );
            })}
          </fieldset>
        ))}
        <Text tone="muted" size="sm">{t("content.englishHelp")}</Text>
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </Stack>
    </form>
  );
}
```

Check `Stack`'s `gap` prop accepts `"lg"` (`src/ui/Stack.tsx`); use `"md"` if not.

- [ ] **Step 9: `ResetSectionForm.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";
import { resetSiteContent } from "./admin-actions";

export function ResetSectionForm({ locale, section }: { locale: Locale; section: string }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(resetSiteContent, null);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(t("content.resetConfirm"))) event.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="section" value={section} />
      {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
      <Button type="submit" variant="secondary" disabled={pending}>{t("content.reset")}</Button>
    </form>
  );
}
```

- [ ] **Step 10: Overview page**

`src/app/[locale]/admin/(protected)/content/page.tsx`:

```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { CONTENT_KEYS, isLegalKey, PHOTO_SLOTS, photoSrc, SECTION_SLUGS, type ContentKey, type SiteContent } from "@/features/site-content/content";
import { hasPlaceholder } from "@/features/site-content/legal-check";
import { getContentMeta, getSiteContent } from "@/features/site-content/queries";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";

/** One line of German text that identifies the section's current content. */
function previewOf(key: ContentKey, content: SiteContent): string {
  switch (key) {
    case "home.hero": return content[key].title.de;
    case "home.features": return content[key].match.title.de;
    case "home.steps": return content[key].title.de;
    case "home.employers": return content[key].title.de;
    case "contact": return content[key].whatsapp;
    case "photos": return "";
    case "legal.imprint":
    case "legal.privacy": return content[key].body.de.replace(/[#*\\[\]]/g, "").slice(0, 120);
  }
}

export default async function ContentPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const admin = await requireAdmin(locale);
  const [t, format, content, meta] = await Promise.all([getTranslations("admin.content"), getFormatter(), getSiteContent(), getContentMeta()]);

  return (
    <>
      <AdminPageHeader title={t("title")} />
      <div className="grid gap-4 md:grid-cols-2">
        {CONTENT_KEYS.map((key) => {
          const slug = SECTION_SLUGS[key];
          const legal = isLegalKey(key);
          const canEdit = !legal || admin.role === "owner";
          const placeholders = legal && (hasPlaceholder(content[key].body.de) || hasPlaceholder(content[key].body.en));
          const updated = meta[key];
          return (
            <Card key={key} className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="card-title">{t(`sections.${slug}`)}</h2>
                <span className="flex flex-wrap gap-2">
                  {placeholders ? <span className="tag bg-status-error-bg text-status-error-text">{t("placeholders")}</span> : null}
                  <span className="tag">{updated ? t("edited", { date: format.dateTime(new Date(updated), { dateStyle: "medium" }) }) : t("default")}</span>
                </span>
              </div>
              {key === "photos" ? (
                <div className="flex flex-wrap gap-2">
                  {PHOTO_SLOTS.map((slot) => {
                    const src = photoSrc(content.photos[slot].path);
                    return src ? (
                      // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail, no optimisation needed
                      <img key={slot} src={src} alt="" className="size-14 rounded-md object-cover" />
                    ) : (
                      <span key={slot} className="photo-ph size-14 rounded-md" aria-hidden="true" />
                    );
                  })}
                </div>
              ) : (
                <Text tone="muted" className="line-clamp-2">{previewOf(key, content)}</Text>
              )}
              {canEdit ? (
                <Link href={`/admin/content/${slug}`} className="btn btn-sm max-w-max">{t("edit")}</Link>
              ) : (
                <Text tone="muted" size="sm">{t("ownerOnly")}</Text>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
```

If `bg-status-error-bg` / `text-status-error-text` are not Tailwind tokens in `src/styles/tokens.css`, use the existing `.notice-error` colour variables through an arbitrary value (`bg-[var(--status-error-bg)] text-[var(--status-error-text)]`).

- [ ] **Step 11: Section page (text sections only for now)**

`src/app/[locale]/admin/(protected)/content/[section]/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireAdmin, requireOwner } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { isLegalKey, isTextKey, keyFromSlug } from "@/features/site-content/content";
import { getContentMeta, getSiteContent } from "@/features/site-content/queries";
import { ResetSectionForm } from "@/features/site-content/ResetSectionForm";
import { SECTION_FIELDS } from "@/features/site-content/sections";
import { SectionForm } from "@/features/site-content/SectionForm";
import { Card } from "@/ui/Card";

type Props = { params: Promise<{ locale: Locale; section: string }> };

export default async function ContentSectionPage({ params }: Props) {
  const { locale, section } = await params;
  setRequestLocale(locale);
  const key = keyFromSlug(section);
  if (!key) notFound();
  if (isLegalKey(key)) await requireOwner(locale);
  else await requireAdmin(locale);
  const [t, content, meta] = await Promise.all([getTranslations("admin.content"), getSiteContent(), getContentMeta()]);
  const back = { href: "/admin/content", label: t("title") };

  if (isTextKey(key)) {
    return (
      <>
        <AdminPageHeader title={t(`sections.${section}`)} back={back} actions={meta[key] ? <ResetSectionForm locale={locale} section={section} /> : null} />
        <Card className="max-w-4xl">
          <SectionForm locale={locale} section={section} groups={SECTION_FIELDS[key]} values={content[key]} />
        </Card>
      </>
    );
  }
  // Legal pages (Task 8) and photos (Task 9) are added below.
  notFound();
}
```

- [ ] **Step 12: Sidebar entry**

In `src/app/[locale]/admin/(protected)/layout.tsx`, in the `navGroupSetup` items, after professions:
`{ href: "/admin/content", label: t("navContent"), icon: "file-text" },`

- [ ] **Step 13: Verify**

Run: `npm run typecheck && npm run lint && npm test`. Then in `npm run dev`, sign in as the owner, open Admin → Content, edit the hero title (DE), save, open `/de` and see it; click "Reset to default" and see the original title again. Submit with an empty German title and see the inline error on that field.

- [ ] **Step 14: Commit**

```bash
git add src/features/site-content "src/app/[locale]/admin/(protected)/content" "src/app/[locale]/admin/(protected)/layout.tsx" src/i18n/messages
git commit -m "feat(admin): content overview and editors for home copy and contact details

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Admin legal editor (owner only)

**Files:**
- Create: `src/features/site-content/LegalForm.tsx`
- Modify: `src/app/[locale]/admin/(protected)/content/[section]/page.tsx`

**Interfaces:**
- Consumes: `saveSiteContent` (Task 7, fields `body.de`, `body.en`), `Markdown` (Task 3), `hasPlaceholder` (Task 2).
- Produces: `LegalForm({ locale, section, body: { de: string; en: string } })`.

- [ ] **Step 1: `LegalForm.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { Textarea } from "@/ui/inputs";
import { Markdown } from "@/ui/Markdown";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { saveSiteContent } from "./admin-actions";
import { hasPlaceholder } from "./legal-check";

type Lang = "de" | "en";
type Props = { locale: Locale; section: string; body: Record<Lang, string> };

/** Both languages stay mounted (hidden, not removed) so a save always sends de and en. */
export function LegalForm({ locale, section, body }: Props) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(saveSiteContent, null);
  const [lang, setLang] = useState<Lang>("de");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [text, setText] = useState(body);
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <Stack gap="md">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="section" value={section} />
        {hasPlaceholder(text.de) || hasPlaceholder(text.en) ? (
          <p className="notice notice-error"><Icon name="circle-alert" />{t("content.placeholderWarning")}</p>
        ) : null}
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("content.sections." + section)}>
          {(["de", "en"] as const).map((l) => (
            <Button key={l} variant={lang === l ? "primary" : "secondary"} size="sm" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {t(l === "de" ? "content.german" : "content.english")}
            </Button>
          ))}
          <span className="mx-2 border-l border-hairline" aria-hidden="true" />
          {(["write", "preview"] as const).map((m) => (
            <Button key={m} variant={mode === m ? "primary" : "secondary"} size="sm" aria-pressed={mode === m} onClick={() => setMode(m)}>
              {t(`content.${m}`)}
            </Button>
          ))}
        </div>
        {(["de", "en"] as const).map((l) => (
          <div key={l} hidden={lang !== l || mode !== "write"}>
            <Field
              id={`legal-body-${l}`}
              label={`${t("content.fields.body")} (${l.toUpperCase()})`}
              required={l === "de"}
              help={t("content.markdownHelp")}
              errors={fieldErrors[`body.${l}`]?.map((code) => t(`fieldErrors.${code}`))}
            >
              <Textarea
                id={`legal-body-${l}`}
                name={`body.${l}`}
                rows={24}
                className="font-mono text-sm"
                value={text[l]}
                onChange={(event) => setText({ ...text, [l]: event.target.value })}
                invalid={Boolean(fieldErrors[`body.${l}`])}
              />
            </Field>
          </div>
        ))}
        {mode === "preview" ? <Card className="p-6"><Markdown>{text[lang] || text.de}</Markdown></Card> : null}
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </Stack>
    </form>
  );
}
```

Add `import { Card } from "@/ui/Card";`. The German textarea is `required` only through the server schema (no `required` attribute), because a hidden required field blocks submit without a visible message.

- [ ] **Step 2: Wire it into the section page**

In `[section]/page.tsx`, before the final `notFound()`:

```tsx
  if (isLegalKey(key)) {
    return (
      <>
        <AdminPageHeader title={t(`sections.${section}`)} back={back} />
        <Card className="max-w-4xl">
          <LegalForm locale={locale} section={section} body={content[key].body} />
        </Card>
      </>
    );
  }
```

Import `LegalForm` from `@/features/site-content/LegalForm`.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`. In the dev server as the owner: open Content → Privacy policy, see the placeholder warning, switch to Preview, edit a line, save, open `/de/privacy` and see the change. Use the e2e editor (Task 10) or a second admin to confirm an editor gets the 404 page at `/de/admin/content/privacy` and sees "Only the owner can edit this page." on the overview.

- [ ] **Step 4: Commit**

```bash
git add src/features/site-content/LegalForm.tsx "src/app/[locale]/admin/(protected)/content/[section]/page.tsx"
git commit -m "feat(admin): owner-only markdown editor for the legal pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Admin photos editor

**Files:**
- Create: `src/features/site-content/photo-actions.ts`, `src/features/site-content/PhotosEditor.tsx`
- Modify: `src/app/[locale]/admin/(protected)/content/[section]/page.tsx`

**Interfaces:**
- Consumes: `photoPathFor`, `photoSrc`, `contentSchemas.photos`, `PHOTO_SLOTS`, `SiteContent["photos"]` (Task 2); `fieldErrorsByPath`, `unflatten` (Task 7); `createBrowserSupabase`.
- Produces: server actions `setSitePhoto(prev, formData{locale, slot, path})`, `removeSitePhoto(prev, formData{locale, slot})`, `savePhotoAlts(prev, formData{locale, "<slot>.alt.de", "<slot>.alt.en"…})`; `PhotosEditor({ locale, photos })`.

- [ ] **Step 1: `photo-actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { requireAdmin, type AdminSession } from "@/features/admin-auth/session";
import { PHOTO_SLOTS, type PhotoSlot } from "@/features/site/photos";
import { fail, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { contentSchemas, defaults, photoPathFor, type SiteContent } from "./content";
import { fieldErrorsByPath, unflatten } from "./form-data";

type Result = ActionResult<null>;
type Photos = SiteContent["photos"];
type Supabase = Awaited<ReturnType<typeof createServerSupabase>>;

const localeOf = (formData: FormData) => z.enum(locales).catch("en").parse(formData.get("locale"));
const slotOf = (formData: FormData) => z.enum(PHOTO_SLOTS).safeParse(formData.get("slot"));

/** The stored photos row, read fresh (not the cached page read) so concurrent edits of other slots survive. */
async function readPhotos(supabase: Supabase): Promise<Photos | null> {
  const { data, error } = await supabase.from("site_content").select("value").eq("key", "photos").maybeSingle();
  if (error) {
    console.error("read photos failed", error.code);
    return null;
  }
  if (!data) return defaults.photos;
  const parsed = contentSchemas.photos.safeParse(data.value);
  return parsed.success ? parsed.data : defaults.photos;
}

async function writePhotos(supabase: Supabase, session: AdminSession, photos: Photos): Promise<boolean> {
  const { data, error } = await supabase
    .from("site_content")
    .upsert({ key: "photos", value: photos as unknown as Json, updated_by: session.userId }, { onConflict: "key" })
    .select("key");
  if (error || data.length === 0) {
    console.error("write photos failed", error?.code ?? "no row written");
    return false;
  }
  return true;
}

async function removeObject(supabase: Supabase, path: string | null) {
  if (!path) return;
  const { error } = await supabase.storage.from("site").remove([path]);
  if (error) console.error("remove site photo failed", error.name);
}

/** Records a photo the browser already uploaded to `site/<slot>/<uuid>.<ext>`, then deletes the previous file. */
export async function setSitePhoto(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  const session = await requireAdmin(locale);
  const slot = slotOf(formData);
  const path = formData.get("path");
  if (!slot.success || typeof path !== "string" || !photoPathFor(slot.data).test(path)) return fail("invalid");

  const supabase = await createServerSupabase();
  const fileName = path.slice(slot.data.length + 1);
  const { data: listed, error: listError } = await supabase.storage.from("site").list(slot.data, { search: fileName });
  if (listError || !listed.some((object) => object.name === fileName)) return fail("upload_failed");

  const photos = await readPhotos(supabase);
  if (!photos) return fail("server_error");
  const previous = photos[slot.data].path;
  if (!(await writePhotos(supabase, session, { ...photos, [slot.data]: { ...photos[slot.data], path } }))) return fail("server_error");
  if (previous !== path) await removeObject(supabase, previous);
  revalidatePath("/", "layout");
  return ok(null);
}

export async function removeSitePhoto(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  const session = await requireAdmin(locale);
  const slot = slotOf(formData);
  if (!slot.success) return fail("invalid");

  const supabase = await createServerSupabase();
  const photos = await readPhotos(supabase);
  if (!photos) return fail("server_error");
  const previous = photos[slot.data].path;
  if (!(await writePhotos(supabase, session, { ...photos, [slot.data]: { ...photos[slot.data], path: null } }))) return fail("server_error");
  await removeObject(supabase, previous);
  revalidatePath("/", "layout");
  return ok(null);
}

/** Saves the alt texts of all slots; paths are kept from the stored row. */
export async function savePhotoAlts(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  const session = await requireAdmin(locale);
  const supabase = await createServerSupabase();
  const photos = await readPhotos(supabase);
  if (!photos) return fail("server_error");

  const input = unflatten(formData) as Record<string, { alt?: unknown } | undefined>;
  const merged = Object.fromEntries(PHOTO_SLOTS.map((slot: PhotoSlot) => [slot, { path: photos[slot].path, alt: input[slot]?.alt }]));
  const parsed = contentSchemas.photos.safeParse(merged);
  if (!parsed.success) return fail("invalid", fieldErrorsByPath(parsed.error.issues));
  if (!(await writePhotos(supabase, session, parsed.data))) return fail("server_error");
  revalidatePath("/", "layout");
  return ok(null);
}
```

`unflatten` treats `feature-match.alt.de` as segments `feature-match`, `alt`, `de`; its `SEGMENT` pattern allows `-`.

- [ ] **Step 2: `PhotosEditor.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import type { Locale } from "@/i18n/config";
import { PHOTO_SLOTS, type PhotoSlot } from "@/features/site/photos";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import type { SiteContent } from "./content";
import { photoSrc } from "./photo-url";
import { removeSitePhoto, savePhotoAlts, setSitePhoto } from "./photo-actions";

type Photos = SiteContent["photos"];
const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 5 * 1024 * 1024;

function SlotPhoto({ locale, slot, path }: { locale: Locale; slot: PhotoSlot; path: string | null }) {
  const t = useTranslations("admin");
  const [setState, setAction, setPending] = useActionState(setSitePhoto, null);
  const [removeState, removeAction, removePending] = useActionState(removeSitePhoto, null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const src = photoSrc(path);
  const failed = uploadError || (setState && !setState.ok) || (removeState && !removeState.ok);

  async function upload(file: File) {
    setUploadError(false);
    const ext = EXTENSIONS[file.type];
    if (!ext || file.size > MAX_BYTES) return setUploadError(true);
    setUploading(true);
    const newPath = `${slot}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createBrowserSupabase().storage.from("site").upload(newPath, file, { contentType: file.type });
    setUploading(false);
    if (error) return setUploadError(true);
    const data = new FormData();
    data.set("locale", locale);
    data.set("slot", slot);
    data.set("path", newPath);
    startTransition(() => setAction(data));
  }

  return (
    <div className="grid gap-3">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of the stored file
        <img src={src} alt="" className="aspect-[4/3] w-full max-w-xs rounded-md object-cover" />
      ) : (
        <Text tone="muted" size="sm">{t("content.noPhoto")}</Text>
      )}
      <label className="btn btn-sm max-w-max cursor-pointer">
        {uploading || setPending ? t("content.uploading") : src ? t("content.photoReplace") : t("content.photoUpload")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label={`${t(`content.slots.${slot}`)}: ${src ? t("content.photoReplace") : t("content.photoUpload")}`}
          disabled={uploading || setPending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
      </label>
      <Text tone="muted" size="sm">{t("content.photoHelp")}</Text>
      {src ? (
        <form
          action={removeAction}
          onSubmit={(event) => {
            if (!window.confirm(t("content.photoRemoveConfirm"))) event.preventDefault();
          }}
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="slot" value={slot} />
          <Button type="submit" variant="ghost" size="sm" disabled={removePending}>{t("content.photoRemove")}</Button>
        </form>
      ) : null}
      {failed ? <Text role="alert" tone="danger">{t(uploadError ? "errors.upload_failed" : "errors.server_error")}</Text> : null}
    </div>
  );
}

export function PhotosEditor({ locale, photos }: { locale: Locale; photos: Photos }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(savePhotoAlts, null);
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <Stack gap="lg">
      {PHOTO_SLOTS.map((slot) => (
        <section key={slot} className="card grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <h2 className="card-title md:col-span-2">{t(`content.slots.${slot}`)}</h2>
          <SlotPhoto locale={locale} slot={slot} path={photos[slot].path} />
          <div className="grid content-start gap-4">
            {(["de", "en"] as const).map((l) => {
              const name = `${slot}.alt.${l}`;
              const id = `alt-${slot}-${l}`;
              return (
                <Field key={l} id={id} label={`${t("content.fields.alt")} (${l.toUpperCase()})`} help={l === "de" ? t("content.altHelp") : undefined} errors={fieldErrors[name]?.map((c) => t(`fieldErrors.${c}`))}>
                  <Input id={id} name={name} form="photo-alts" defaultValue={photos[slot].alt[l]} invalid={Boolean(fieldErrors[name])} />
                </Field>
              );
            })}
          </div>
        </section>
      ))}
      <form
        id="photo-alts"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => action(data));
        }}
      >
        <input type="hidden" name="locale" value={locale} />
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("content.saveAlts")}</Button>
      </form>
    </Stack>
  );
}
```

The alt inputs live outside `<form id="photo-alts">` and join it through the `form` attribute, so the per-slot remove forms are not nested inside it. `new FormData(form)` includes inputs associated through `form=`.

- [ ] **Step 3: Wire it into the section page**

In `[section]/page.tsx`, before the final `notFound()`:

```tsx
  if (key === "photos") {
    return (
      <>
        <AdminPageHeader title={t("sections.photos")} back={back} />
        <PhotosEditor locale={locale} photos={content.photos} />
      </>
    );
  }
```

Import `PhotosEditor`. After this the final `notFound()` is unreachable for valid keys; keep it as the exhaustive fallback.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint && npm test`. In the dev server: upload a JPEG to Hero → preview appears, `/de` shows it through `/_next/image`; replace it → the old object disappears from Supabase Studio (`http://127.0.0.1:54323`, Storage → site → hero); remove it → placeholder returns; try a 6 MB file and an SVG → "The upload failed…" message, nothing stored.

- [ ] **Step 5: Commit**

```bash
git add src/features/site-content/photo-actions.ts src/features/site-content/PhotosEditor.tsx "src/app/[locale]/admin/(protected)/content/[section]/page.tsx"
git commit -m "feat(admin): upload, replace and remove site photos with alt texts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: End-to-end tests, docs and final check

**Files:**
- Create: `e2e/site-content.spec.ts`
- Modify: `docs/superpowers/plans/2026-10-01-roadmap.md`, `README.md`

**Interfaces:**
- Consumes: `signIn`, `E2E_ADMIN` (e2e), `ensureAdmin` (`scripts/lib/ensure-admin`), all routes above.

- [ ] **Step 1: Write the e2e spec**

`e2e/site-content.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { ensureAdmin } from "../scripts/lib/ensure-admin";
import { signIn } from "./helpers";

const EDITOR = { email: "e2e-content-editor@iprince.local", password: "e2e-password-123" };
// 1×1 transparent PNG.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

test.beforeAll(async () => {
  await ensureAdmin({ ...EDITOR, role: "editor", displayName: "E2E Content Editor" });
});

test("an admin edits the hero and resets it to the default", async ({ page }) => {
  const title = `E2E Hero ${Date.now()}`;
  await signIn(page);
  await page.goto("/en/admin/content");
  await page.getByRole("link", { name: "Edit" }).first().click();
  await expect(page).toHaveURL(/\/en\/admin\/content\/hero$/);

  await page.getByLabel("Title (DE)").fill(title);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
  await page.goto("/de");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

  await page.goto("/en/admin/content/hero");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset to default" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/content$/);
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your path to a successful career in Germany");
});

test("an editor cannot open the legal editor", async ({ page }) => {
  await signIn(page, EDITOR);
  await page.goto("/en/admin/content");
  await expect(page.getByText("Only the owner can edit this page.").first()).toBeVisible();
  const response = await page.goto("/en/admin/content/privacy");
  expect(response?.status()).toBe(404);
});

test("the owner uploads and removes a hero photo", async ({ page }) => {
  await signIn(page);
  await page.goto("/en/admin/content/photos");
  await page.getByLabel("Hero: Upload photo").setInputFiles({ name: "hero.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("button", { name: "Remove photo" })).toBeVisible({ timeout: 15_000 });

  await page.goto("/en");
  const hero = page.getByRole("img", { name: "Skilled worker starting a new job in Germany" });
  await expect(hero).toHaveAttribute("src", /storage%2Fv1%2Fobject%2Fpublic%2Fsite%2Fhero%2F/);

  await page.goto("/en/admin/content/photos");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remove photo" }).click();
  await expect(page.getByText("No photo yet. A placeholder is shown.").first()).toBeVisible();
});

test("legal pages render, are linked from the footer and fall back to German", async ({ page }) => {
  await page.goto("/de");
  await page.getByRole("contentinfo").getByRole("link", { name: "Impressum" }).click();
  await expect(page).toHaveURL(/\/de\/imprint$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Impressum");

  await page.goto("/en");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy policy" }).click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
  await expect(page.getByText("This page is only available in German.")).toHaveCount(0);

  await signIn(page);
  await page.goto("/en/admin/content/privacy");
  await page.getByRole("button", { name: "English" }).click();
  const english = page.getByLabel("Text (EN)");
  const original = await english.inputValue();
  await english.fill("");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");

  await page.goto("/en/privacy");
  await expect(page.getByText("This page is only available in German.")).toBeVisible();
  await expect(page.locator("[lang=de]").getByRole("heading", { name: "1. Verantwortlicher" })).toBeVisible();

  await page.goto("/en/admin/content/privacy");
  await page.getByRole("button", { name: "English" }).click();
  await page.getByLabel("Text (EN)").fill(original);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
});
```

- [ ] **Step 2: Run e2e**

Run: `npm run test:e2e`
Expected: all specs pass, including the existing `layout.spec.ts` (if it asserted the footer's legal nav or the WhatsApp label text, update the assertion to the new markup and note it in the commit).

- [ ] **Step 3: Roadmap and README**

In `docs/superpowers/plans/2026-10-01-roadmap.md`:
- Phase 3 Step 1 becomes: `- [ ] **Step 1:** Run \`npm run check:legal\` with the production \`NEXT_PUBLIC_SUPABASE_URL\` / \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`; it must pass (no missing legal page, no \`[PLATZHALTER\` left).`
- Add after Phase 3 Step 4: `- [ ] **Step 4b:** In the CookieScript dashboard, set the privacy-policy link to \`https://<domain>/de/privacy\` (and \`/en/privacy\` for English).`
- In §2e carry-overs, delete `interpolate the WhatsApp number into \`site.whatsappLabel\` (or do it in 2d);` and, under layout-overhaul follow-ups, change "supply real photos for the five slots in `src/features/site/photos.ts`" to "upload real photos under Admin → Content → Photos".

In `README.md`, add under the existing feature bullets:

```markdown
- Site content (`site_content`, one row per section): home copy, contact details, photos and the legal pages are edited under Admin → Content. Keys without a row show the copy in `messages/*.json`. Only the owner edits Impressum and Datenschutz. `npm run check:legal` fails while either still contains `[PLATZHALTER`; run it against production before launch.
```

- [ ] **Step 5: Full check**

Run: `npm run check && npm run test:e2e`
Expected: typecheck, lint, unit tests, pgTAP (now including `site_content`), `next build` and all e2e specs pass.

- [ ] **Step 6: Commit**

```bash
git add e2e/site-content.spec.ts docs/superpowers/plans/2026-10-01-roadmap.md README.md
git commit -m "test(e2e): site content, photos and legal pages; document the launch gate

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Review, then ask before merging**

Run `superpowers:requesting-code-review` on `main..feat/site-content`. After fixes, ask the user; on yes: `git checkout main && git merge --no-ff feat/site-content`. Then update `foundation-decisions.md` in memory with "2d merged".
