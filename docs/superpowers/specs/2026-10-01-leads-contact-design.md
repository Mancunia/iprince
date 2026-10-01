# Plan 3 · 2a: Employer Enquiries and Contact Messages

Date: 2026-10-01 · Branch: `feat/leads` · Parent specs: `2026-09-30-foundation-design.md`, `2026-09-30-plan2-admin-design.md` · Roadmap: `docs/superpowers/plans/2026-10-01-roadmap.md` §2a

## Goal
Employers can send an enquiry and anyone can send a contact message from the public site. Staff are emailed a link to each new entry and work through them in an admin inbox (status, notes, delete). Entries are deleted automatically after a fixed retention period.

The tables `employer_leads` and `contact_messages` and their RLS (admin-only, no public read or insert) already exist. **2a adds no migration.**

## Decisions
| Topic | Decision |
|---|---|
| Where the forms live | `/[locale]/employers` (dark `.door-employer` page with the enquiry form), `/[locale]/contact` (light page with the contact form), a `.door-split` section on the home page, header link "Employers", footer column "Employers" |
| Path language | English segments, like `/apply/[slug]`; no localized pathnames |
| Staff notification | One email per new entry via the Resend REST API (plain `fetch`), sent in `after()`. Fails soft: no env or send error never blocks the submission |
| Email content | No personal data except the company name in the enquiry subject; body is a link to the admin detail page |
| Confirmation to submitter | None (abuse vector) |
| Retention | Contact messages: deleted 6 months after `updated_at`, any status. Enquiries: `closed`/`archived` deleted 12 months after `updated_at`; open ones (`new`, `contacted`, `qualified`) kept |
| Cron | Existing job renamed `/api/cron/cleanup` and extended; one daily cron |
| Statuses | Existing enums unchanged: leads `new, contacted, qualified, closed, archived`; messages `new, read, archived` |
| Notes | Enquiries have `admin_notes`; messages do not |
| Consent | No checkbox; privacy note under the submit button (Art. 6(1)(b) GDPR, pre-contractual) |
| Rate limit | 5 per hour per IP, buckets `lead` and `contact` |
| Permissions | Owner and editors: read, update, delete both |
| Read state | Opening a message does not mark it `read`; staff set status explicitly |
| Out of scope | Auto-reply, attachments, CSV export, bulk actions, assigning entries to staff, spam scoring beyond honeypot + rate limit |

## 1. Code layout
One domain, `src/features/leads/`:

| File | Purpose |
|---|---|
| `schema.ts` | zod: `leadInput`, `contactInput`, `leadUpdate`, `messageUpdate`; status lists `LEAD_STATUSES`, `MESSAGE_STATUSES` |
| `guard.ts` | pure `guardSubmission({ honeypot, rateAllowed })` decision used by both public actions |
| `actions.ts` | `'use server'`: `submitLead`, `submitContact` (service role) |
| `notify.ts` | `server-only`: `notifyStaff(kind, id, origin, subjectExtra?)` via Resend |
| `retention.ts` | pure `retentionCutoffs(now)` + `deleteExpired(supabase: ServiceClient, now)` |
| `admin-queries.ts` | `server-only`: `listLeads(status?)`, `getLead(id)`, `listMessages(status?)`, `getMessage(id)`, `countNew()` |
| `admin-actions.ts` | `'use server'`: `updateLead`, `deleteLead`, `updateMessage`, `deleteMessage` |
| `LeadForm.tsx`, `ContactForm.tsx` | client forms (`useActionState`) |
| `LeadReviewForm.tsx`, `MessageStatusForm.tsx`, `DeleteEntryForm.tsx` | admin client forms |

## 2. Public pages

**`src/app/[locale]/(site)/employers/page.tsx`.** Wrapped in `.door-employer`. Kicker, h1, lead, a `.door-list` with three benefits, then `LeadForm`. Fields:

| Field | Column | Rule |
|---|---|---|
| Company * | `company` | trimmed, 1–200 |
| Contact name * | `contact_name` | trimmed, 1–200 |
| Email * | `email` | `z.email()`, max 254 |
| Phone | `phone` | optional, max 50, empty → `null` |
| Professions | `profession_ids` | checkbox group from `listActiveProfessions()` (extend `ProfessionCard` with `id`); uuids, max 50; `submitLead` drops ids that are not active professions (service-role lookup) |
| Headcount | `headcount` | optional integer 1–999, empty → `null` |
| Message | `message` | optional, max 5000, default `''` |
| `hp_field` | — | hidden honeypot, must be empty |

**`src/app/[locale]/(site)/contact/page.tsx`.** Normal light page. `ContactForm` fields: name * (1–200), email *, message * (1–5000), `hp_field`. A side column shows the WhatsApp contact (`WHATSAPP_URL`).

Both forms end with a privacy note under the submit button. It links to the privacy policy once 2d ships; until then it is text only.

**Home (`(site)/page.tsx`).** New `.door-split` section between `#berufe` and `#ablauf`. Candidate door links to `#berufe`, employer door (`.door-employer`) links to `/employers`.

**Chrome.** `SiteHeader` nav gets "Employers" (`/employers`). `SiteFooter` gets a column "Employers" with links to `/employers` and `/contact`.

**Submit flow** (`submitLead` / `submitContact`, same order as `submitApplication`):
1. Parse with zod. On failure `fail("invalid", fieldErrors)`.
2. Honeypot filled → `ok` without inserting (bots learn nothing).
3. `hit_rate_limit(bucket, ip, 5, 3600)`. RPC error → `fail("server_error")`; not allowed → `fail("rate_limited")`. Validation failures never use quota.
4. Insert with `createServiceSupabase()`, `select("id")`. Error → log code only, `fail("server_error")`.
5. `after(() => notifyStaff(...))`.
6. `ok`. The client replaces the form with a thank-you notice ("we'll get back to you within one working day").

All strings go into `de.json` and `en.json` (`employers.*`, `contact.*`, `site.navEmployers`, `site.footerEmployers`, error keys reuse the existing `invalid` / `rate_limited` / `server_error` pattern).

## 3. Admin inbox

**Nav.** In `admin/(protected)/layout.tsx`, after Applications: "Enquiries" (`/admin/leads`, icon `building`) and "Messages" (`/admin/messages`, icon `mail`), for owners and editors. Each label shows a count badge of `status = 'new'` rows, from `countNew()` (two `select("id", { count: "exact", head: true })` queries with the admin session). Badge hidden at 0.

**`/admin/leads`.** Same layout as `/admin/applications`: status filter form, newest first, `INBOX_LIMIT` (200) with the limit notice. Row: company, contact name, profession names, created date, status. Profession names are resolved from `profession_ids` against all professions (inactive included); unknown ids are skipped.

**`/admin/leads/[id]`.** All fields; email as `mailto:`, phone as `tel:`; `LeadReviewForm` (status select + notes textarea, max 5000); a danger section with `DeleteEntryForm` (confirm step, then delete and redirect to the list). Invalid or unknown id → `notFound()`.

**`/admin/messages`, `/admin/messages/[id]`.** Same structure. List row: name, first 80 characters of the message, created date, status. Detail: full message (whitespace preserved), `MessageStatusForm`, delete.

**Admin actions.** Each calls `requireAdmin(locale)` before parsing any other input, uses `createServerSupabase()` (RLS applies), validates with zod, returns `ActionResult`, then `revalidatePath` for the list, the detail page and the layout (badges). Deletes redirect to the list.

## 4. Notification email
`src/env.ts` gets `readNotifyEnv()`: optional `RESEND_API_KEY`, `NOTIFY_EMAIL_TO` (email), `NOTIFY_EMAIL_FROM` (e.g. `iPrince <noreply@example.com>`). Returns `null` unless all three are set; invalid values throw like the other readers.

`notifyStaff(kind: "lead" | "contact", id, origin, company?)`:
- `null` env → `console.info("notify skipped", { kind })`, return.
- One `POST https://api.resend.com/emails` with `Authorization: Bearer <key>`, JSON `{ from, to, subject, text }`, `AbortSignal.timeout(5000)`.
- Subject: `Neue Arbeitgeber-Anfrage: <company>` / `Neue Kontaktnachricht`. Text: one sentence plus `<origin>/de/admin/leads/<id>` or `<origin>/de/admin/messages/<id>`. Nothing else from the submission.
- Non-2xx or thrown error → `console.error("notify failed", { kind, id, status })`. Never throws.

`origin` is built in the action from the request headers (`x-forwarded-proto` + `host`), the same way invite links are built.

`.env.example` and the README document the three variables. Phase 3 gains: Resend account, verified sending domain (can double as Supabase custom SMTP), set the three variables in Vercel.

## 5. Retention
`retention.ts`:
- `MESSAGE_RETENTION_MONTHS = 6`, `LEAD_RETENTION_MONTHS = 12`, `LEAD_EXPIRING_STATUSES = ["closed", "archived"]`.
- `retentionCutoffs(now)` → `{ messages, leads }` as ISO strings (calendar months back, UTC).
- `deleteExpired(supabase, now)` → `{ leadsDeleted, messagesDeleted }`:
  - `contact_messages.delete({ count: "exact" }).lt("updated_at", cutoffs.messages)`
  - `employer_leads.delete({ count: "exact" }).in("status", LEAD_EXPIRING_STATUSES).lt("updated_at", cutoffs.leads)`
  - Throws on error. Idempotent.

Any admin edit (status or notes) bumps `updated_at` via the existing trigger, so active work extends retention.

**Cron route.** Move `src/app/api/cron/cleanup-applications/route.ts` to `src/app/api/cron/cleanup/route.ts`. After the `CRON_SECRET` check it runs `cleanupAbandoned` and `deleteExpired` in separate `try` blocks, logs counts only, and returns `{ applications, leads }` where a failed step is `{ error: "failed" }`; status 500 if any step failed, else 200. `vercel.ts` path becomes `/api/cron/cleanup`. README and roadmap Phase 3 Step 7 are updated to the new path.

The periods (6 / 12 months) are recorded in the README so 2d can quote them in the privacy policy.

## 6. Testing
**Unit (Vitest).**
- `schema.test.ts`: required fields, email format, trimming, empty phone/headcount → `null`, headcount bounds, length limits, profession id list.
- `guard.test.ts`: honeypot → fake ok, no insert; rate limit denied → `rate_limited`; allowed → proceed.
- `notify.test.ts` (mocked `fetch`): skipped without env; payload has the right subject/link and no email/name/message; non-2xx and timeout are swallowed and logged without personal data.
- `retention.test.ts`: cutoffs across month ends and year boundary.
- `env.test.ts`: `readNotifyEnv` null when partial, parsed when complete, throws on an invalid address.

**pgTAP (`supabase/tests/database/leads.test.sql`).** anon cannot select or insert either table; an authenticated non-admin sees no rows and cannot insert; an editor can select, update and delete both.

**e2e (`e2e/leads.spec.ts`).** As anon: submit the employer form (with one profession) and the contact form, see the thank-you notices. Sign in as admin: badges show the new counts; find the enquiry, set `contacted` and a note; find the message, set `read`, delete it. A submission with the honeypot filled does not appear.

**e2e (`e2e/cleanup.spec.ts`).** Updated to `/api/cron/cleanup`. Seeds a message 7 months old, a `closed` lead 13 months old and a `new` lead 13 months old (service-role inserts with an explicit past `updated_at`; the `set_updated_at` trigger only fires on update, so the value sticks); after the call the first two are gone and the open lead remains.

## Acceptance
- Both forms submit as anon and the entries appear in the admin inbox (e2e).
- anon cannot read either table (pgTAP).
- Honeypot and rate limit are unit-tested; validation failures do not use quota.
- No personal data in logs or notification emails.
- `npm run check` and `npm run test:e2e` pass.
