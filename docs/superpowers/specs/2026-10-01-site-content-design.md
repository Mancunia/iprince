# Plan 3 · 2d: Site Content, Photos and Legal Pages

Date: 2026-10-01 · Branch: `feat/site-content` · Parent specs: `2026-09-30-foundation-design.md`, `2026-09-30-plan2-admin-design.md` · Roadmap: `docs/superpowers/plans/2026-10-01-roadmap.md` §2d

## Goal
Admins change the key public copy, the contact details and the five site photos without a deploy. The site gets an Impressum and a Datenschutzerklärung (de + en), edited as markdown by the owner only. Production cannot launch while the legal texts still contain placeholders.

The table `site_content(key unique, value jsonb, updated_by)` and its public-read RLS already exist. 2d replaces its admin policy, constrains its keys and adds a `site` storage bucket.

## Decisions
| Topic | Decision |
|---|---|
| Editable copy | Home hero, the two feature blocks, the three steps, the employer door section, contact details, photos (+ alt text), Impressum, Datenschutz |
| Stays in `messages/*.json` | Every label, button, nav item, form label, stat label and badge not listed above |
| Storage | One `site_content` row per section key, each with its own zod schema (approach A) |
| Defaults | A key without a row (or with an invalid value) renders the current `messages/*.json` copy; a fresh database looks exactly like today |
| Translated text | `{de, en}` with `de` required; empty `en` falls back to `de` (existing `localized()`) |
| Permissions | All admins: copy, contact, photos. Owner only: `legal.*`. Enforced in server actions and RLS |
| Legal format | Markdown de/en, rendered with `react-markdown`, raw HTML disabled |
| Legal source | Client's lawyer/generator supplies final texts; a migration inserts a drafted structure with `[PLATZHALTER: …]` markers |
| Launch gate | `npm run check:legal` fails while a legal row is missing or contains `[PLATZHALTER` |
| Paths | `/[locale]/imprint`, `/[locale]/privacy` (English segments like `/contact`, `/employers`) |
| Photos | Public `site` bucket, admins write; upload straight from the browser with the admin session |
| Editor layout | Overview page + one edit page per key; no single long form |
| Reset | Text sections and contact can be reset to default (row deleted); legal and photos cannot |
| Out of scope | Version history of content, scheduled changes, editing labels/buttons, image cropping, per-profession photos, adding new photo slots from the admin |

## 1. Data and security

**Migration `20261001000002_site_content.sql`:**
- Drop `site_content_admin_all`. Add:
  - `site_content_admin_copy`: `for all to authenticated` using / with check `is_admin() and key not like 'legal.%'`.
  - `site_content_owner_legal`: `for all to authenticated` using / with check `is_owner() and key like 'legal.%'`.
  - `site_content_public_read` stays.
- `alter table site_content add constraint site_content_key_known check (key in ('home.hero', 'home.features', 'home.steps', 'home.employers', 'contact', 'photos', 'legal.imprint', 'legal.privacy'))`.
- Bucket `site`: public, `file_size_limit` 5 MB (5242880), `allowed_mime_types` `{image/jpeg, image/png, image/webp}`. Storage enforces size and type on upload, so no server-side metadata check is needed. Policy `"site bucket: admins write"` mirrors the `blog` one.
- Insert the two legal drafts (§5) with `on conflict (key) do nothing`. They live in the migration, not `seed.sql`, because production runs `db push` without the seed.

**Keys and value shapes** (`L` = `{de: string (required, trimmed, ≥1), en?: string}`):

| Key | Value |
|---|---|
| `home.hero` | `{kicker: L, title: L, lead: L}` |
| `home.features` | `{match: {eyebrow, title, text: L}, advisors: {eyebrow, title, text, badgeTitle, badgeText: L}}` |
| `home.steps` | `{kicker: L, title: L, choose: {title, text: L}, apply: {title, text: L}, contact: {title, text: L}}` |
| `home.employers` | `{kicker: L, title: L, text: L}` |
| `contact` | `{whatsapp: string (display form, must contain 7–15 digits), email?: email, address?: string (multi-line, ≤500)}` |
| `photos` | `{[slot]: {path: string \| null, alt: L}}` for the five slots in `PHOTO_SLOTS` |
| `legal.imprint`, `legal.privacy` | `{body: L}` (markdown, ≤50 000 chars per language) |

Feature/steps image alt texts move from `home.*Alt` into `photos.<slot>.alt`.

**Code: `src/features/site-content/`**

| File | Purpose |
|---|---|
| `content.ts` | zod schema per key (`contentSchemas`), `ContentKey`, `SiteContent` type, `defaults` (built from today's `messages/*.json` copy), `whatsappHref(display)` → `https://wa.me/<digits>`, `hasPlaceholder(body)` |
| `queries.ts` | `server-only`, `cache()`d `getSiteContent()`: one `select key, value, updated_at` of all rows; each key parsed with its schema, missing/invalid → default; a read error logs (no content) and returns all defaults. `getContentMeta()` for the admin overview (`updated_at` per key) |
| `form-data.ts` | pure: `parseSectionForm(key, formData)` → `{success, data} \| {success: false, fieldErrors}` |
| `admin-actions.ts` | `'use server'`: `saveSiteContent`, `resetSiteContent`, `setSitePhoto`, `removeSitePhoto` (§2) |
| `legal-draft.ts` | the draft markdown; the migration's insert is a literal copy, kept equal by a test (§5) |

`src/features/site/contact.ts` and the `PHOTOS` map in `photos.ts` are removed; `PHOTO_SLOTS` stays.

## 2. Admin editor

**Navigation:** "Content" item in the admin sidebar for all admins, after Professions.

**`admin/(protected)/content/page.tsx` (overview).** One `Card` per key: Hero, Features, Steps, Employers, Contact, Photos, Impressum, Datenschutz. Each shows *Default* or *Edited · <date>*, a short German preview (photos: thumbnails) and an Edit link. Legal cards show a danger badge "Contains placeholders" while `hasPlaceholder(de) || hasPlaceholder(en)`. Editors see legal cards with "Only the owner can edit" and no link.

**`admin/(protected)/content/[key]/page.tsx` (edit).** Unknown key → `notFound()`. `legal.*` → `requireOwner(locale)` (editors get the same 404 as Settings), else `requireAdmin(locale)`.
- Text sections and contact: de/en inputs side by side, field errors inline (same pattern as `ProfessionForm`), Save, and "Reset to default" (confirm, then `resetSiteContent`).
- Legal: de/en tabs, markdown `<textarea>`, Preview tab rendering the shared `<Markdown>`, placeholder warning above the editor.
- Photos: per slot a preview, Replace (file input), Remove, alt text de/en, Save alt texts.

**Photo upload flow:**
1. Browser uploads with the admin's session via `createBrowserSupabase().storage.from('site').upload('<slot>/<uuid>.<ext>', file)`. The bucket's size/MIME limits and the admin-only policy reject anything else.
2. `setSitePhoto(slot, path)` checks `requireAdmin`, that `slot` is in `PHOTO_SLOTS`, that `path` matches `^<slot>/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$` and that the object exists (session `list` on `<slot>/`). It writes the new path into `photos`, then removes the previous object. A failed write leaves the new upload orphaned; that is accepted (bounded by admin actions, 5 MB each).
3. `removeSitePhoto(slot)` sets the path to `null`, then removes the object.

**Server actions.** Every action parses `locale`, calls `requireAdmin(locale)` (or `requireOwner(locale)` for `legal.*`) before any other input, validates with the key's schema, writes with the admin's session (RLS in force, `.select('key')` to catch a silently filtered write), stores `updated_by = auth.uid()`, and `revalidatePath('/', 'layout')`. Results use `ActionResult` + field errors.

## 3. Public pages

**Home (`(site)/page.tsx`).** Reads `getSiteContent()` for hero, features, steps, employer door and photos (+alt). Everything else keeps `getTranslations`.

**`Photo`** takes `src: string | null` (public URL built from the `site` bucket path) instead of looking up `PHOTOS`; `null` keeps the placeholder. `next.config.ts` gets `images.remotePatterns` for `<NEXT_PUBLIC_SUPABASE_URL host>/storage/v1/object/public/site/**` (and `127.0.0.1:54321` locally).

**Contact details.** Header, mobile nav, footer and the WhatsApp button use `contact.whatsapp` / `whatsappHref()`. `site.whatsappLabel` takes `{number}`. The footer shows email (`mailto:`) and address when set. The privacy notes under the lead and contact forms link to `/privacy`.

**Legal pages** `(site)/imprint/page.tsx` and `(site)/privacy/page.tsx`: h1 from messages, body through `<Markdown>`. If `en` is empty on `/en`, render `de` inside `<div lang="de">` under the note "This page is only available in German." `generateMetadata` sets the title.

**`src/ui/Markdown.tsx`:** `react-markdown` (+ `remark-gfm` for tables), no `rehype-raw`, `urlTransform` allowing only `http:`, `https:`, `mailto:`, `tel:` and relative links; prose styling via a `.prose` component class in `src/styles/components.css`. Reused by 2c Blog.

**Footer legal nav:** Impressum · Datenschutz · Cookie settings (the last only when CookieScript is configured, as today).

**CookieScript banner:** its privacy-policy link is set in the CookieScript dashboard; added to the Phase 3 checklist.

## 4. i18n
New `admin.content.*` (overview, section names, field labels, reset/confirm, placeholder badge, owner-only note, photo actions, errors) and `site.imprint`, `site.privacy`, `site.germanOnly`, `site.email`, `site.address` in both `de.json` and `en.json`. Moved copy (hero, features, steps, door texts, `*Alt`) stays in messages as the source of `defaults` until the plan's final step deletes keys no longer read.

## 5. Legal drafts and launch gate
`legal-draft.ts` holds German and English drafts.
- **Impressum:** company name, legal form, address, managing director, contact, commercial register, VAT ID, responsible for content (§ 18 MStV), EU dispute-resolution note. Each client fact is `[PLATZHALTER: …]`.
- **Datenschutzerklärung:** controller; data processed per form (application, enquiry, contact); legal bases; recipients/processors: Supabase (EU region), Vercel, WhatsApp (Meta), tawk.to, CookieScript, Resend; retention: unsubmitted applications deleted within 48 h, contact messages after `MESSAGE_RETENTION_MONTHS`, closed/archived enquiries after `LEAD_RETENTION_MONTHS` months, submitted applications `[PLATZHALTER]`; data-subject rights; supervisory authority `[PLATZHALTER]`; cookies and consent.
- A unit test asserts the migration's inserted bodies equal `legal-draft.ts` and that the retention numbers in the text equal the constants in `src/features/leads/retention.ts`.
- The drafts are a structure, not legal advice; the client's lawyer reviews the final text.

**`scripts/check-legal.ts`** (`npm run check:legal`): reads `legal.imprint` and `legal.privacy` with the env's Supabase URL and anon key; exits 1 when a row is missing or either language contains `[PLATZHALTER`. Roadmap Phase 3 Step 1 runs it against production.

## 6. Testing
- **pgTAP `site_content.test.sql`:** anon reads all rows, cannot insert/update; editor updates `home.hero`, cannot update `legal.privacy`; owner updates both; unknown key rejected; anon cannot upload to `site`; admin can.
- **Unit:** each schema (valid, missing `de`, too long), `defaults` match `messages/*.json`, invalid stored value → default, `whatsappHref`, `hasPlaceholder`, `parseSectionForm`, photo path regex, `<Markdown>` drops `<script>`, `onerror` and `javascript:` links, retention-number test (§5).
- **e2e `site-content.spec.ts`:** admin edits the hero title → visible on `/de`; reset → default back; editor gets 404 on `/de/admin/content/legal.privacy`; owner uploads a photo → shown on home; `/de/imprint` and `/en/privacy` render and are linked from the footer; `/en/privacy` falls back to German when `en` is empty.

## Acceptance
- Content edits appear on the public site without a deploy; a key without a row renders today's copy.
- Only the owner can change legal pages (pgTAP + e2e).
- The privacy draft states 48 h deletion of unsubmitted applications and the lead/message retention periods, matching the code.
- `npm run check:legal` fails on the seeded drafts and passes once placeholders are gone.
- `npm run check` and `npm run test:e2e` pass.
