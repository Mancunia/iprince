# Plan 2: Professions, Form Builder, Staff Invites, Abandoned-Application Cleanup

Date: 2026-09-30 · Branch: `feat/foundation` (continues Plan 1) · Parent spec: `2026-09-30-foundation-design.md`

## Goal
Staff can create a profession, build and publish its application form, and have it live on `/apply/<slug>` with no SQL. The owner can invite and remove editors. Unsubmitted applications and orphaned uploads are deleted automatically — a **pre-production GDPR gate**.

Plan 1 already created every table and RLS policy used here; Plan 2 adds one migration (functions + one index), admin UI, server actions, a cron route and tests.

## Decisions
| Topic | Decision |
|---|---|
| Abandoned retention | 24 h after `created_at`; effective deletion within 24–48 h (daily job) |
| Job runner | Vercel Cron → Next route `GET /api/cron/cleanup-applications`, guarded by `CRON_SECRET`; daily `0 3 * * *` (hourly possible later on Vercel Pro) |
| Builder UI | Structured field editor with live preview; no raw-JSON tab, no drag-and-drop |
| Permissions | Owner + editors: professions and forms. Owner only: team |
| New staff role | Always `editor`; no second owner in Plan 2 |
| Out of scope | Retention of *submitted* applications, invite resend (remove + re-invite instead), slug-redirects, bulk actions, drag reorder |

## 1. Cleanup job

**Definitions.** *Abandoned application*: `submitted_at is null and created_at < cutoff`. *Orphaned object*: an object in bucket `applications` with `created_at < cutoff` whose `name` is not in `application_files.storage_path`. `cutoff = now() - interval '24 hours'`. Because signed upload URLs expire after ~2 h, nothing can still be uploading for anything older than the cutoff.

**Migration `20260930000006_plan2.sql`** (cleanup part) — both functions `security definer set search_path = ''`, execute revoked from `public, anon, authenticated`, granted to `service_role`:
- `orphaned_application_objects(p_cutoff timestamptz, p_limit int) returns setof text` — object names, oldest first.
- `delete_abandoned_applications(p_cutoff timestamptz) returns int` — deletes matching rows, returns the count.

**Code.**
- `src/features/applications/cleanup.ts` — `cleanupAbandoned(supabase: ServiceClient, now: Date)`: loop `orphaned_application_objects(cutoff, 500)` → `storage.from('applications').remove(names)` until empty or a 50 s time budget is spent; then `delete_abandoned_applications(cutoff)`. Returns `{ filesDeleted, applicationsDeleted, complete }`. Files before rows; every step idempotent, so a failed or partial run is finished by the next one.
- `src/app/api/cron/cleanup-applications/route.ts` — `GET`; compares `Authorization` to `Bearer ${CRON_SECRET}` in constant time, else 401; calls `cleanupAbandoned`; logs counts only (no personal data); returns JSON, 500 on error. `/api` is already outside the i18n proxy matcher.
- `src/env.ts` — `readCronEnv()` with `CRON_SECRET` (min 32 chars), separate from `readServerEnv` so local dev without it keeps working. Added to `.env.example`, `scripts/local-env.sh` and the README.
- `vercel.ts` — `crons: [{ path: '/api/cron/cleanup-applications', schedule: '0 3 * * *' }]` (adds `@vercel/config` dev dependency).
- A late `finalizeApplication` for a deleted row already fails cleanly (`finalize_application` returns false).

## 2. Profession management

**Pages** (`src/app/[locale]/admin/(protected)/professions/`): `page.tsx` (list), `new/page.tsx`, `[id]/page.tsx` (edit). Nav gains "Professions".
- List columns: localized name, slug, active, featured, open positions, sort order, form status (`No form` / `vN live` / `vN live · draft pending`). Order: featured desc, sort_order.
- `ProfessionForm` (shared by new/edit): slug; name de/en and summary de/en (de required); icon select from `public/icons` with preview; is_active, is_featured; sort_order (int); open_positions (int ≥ 0). Edit page links to the form builder and has Delete.

**Actions** (`src/features/professions/admin-actions.ts`), same shape as `updateApplication`: `requireAdmin` first → zod parse → user-session Supabase → `ActionResult` with field errors → `revalidatePath` for admin and public pages.
- `createProfession` — always inserted inactive; redirects to `/admin/professions/[id]/form`.
- `updateProfession` — rejects `is_active = true` while `current_form_id` is null (`fieldErrors.is_active = ["form_required"]`), via pure helper `canActivate`.
- Unique-violation on slug (`23505`) → `fieldErrors.slug = ["taken"]`.
- `deleteProfession` — FK `restrict` from `applications` (`23503`) → `fail("has_applications")` ("deactivate instead"); otherwise deletes (forms cascade).

Queries in `src/features/professions/admin-queries.ts`.

## 3. Form builder

**Model.** At most one draft (`published_at is null`) per profession — new partial unique index `profession_forms_one_draft on (profession_id) where published_at is null`. The existing immutability trigger keeps published versions read-only.

**Migration** (builder part) — `security invoker`, granted to `authenticated` only (RLS still requires `is_admin()`):
- `start_form_draft(p_profession_id uuid) returns uuid` — returns the existing draft, or inserts version `max(version)+1` with the current published schema (or `{"fields": []}`).
- `publish_form_draft(p_form_id uuid, p_expected_updated_at timestamptz) returns void` — in one transaction: sets `published_at = now()` only if the row is still a draft and `updated_at = p_expected_updated_at` (else raises `P0002` stale), then sets `professions.current_form_id`.

**Page** `src/app/[locale]/admin/(protected)/professions/[id]/form/page.tsx` (server) loads the live version, the draft and the version list (version, published_at, application count).
- No draft: live version shown read-only via the preview + "Start editing" (calls `startFormDraft`).
- Draft: `FormBuilder` client component (`src/features/forms/builder/`) holding the `FormDefinition` in state:
  - Field list: label, type, required badge; ↑ ↓ ✕; "Add field" by type.
  - Field panel: key (suggested from the de label as snake_case, validated live against the existing key rules), type, label/help de/en, required, section, options (value + label de/en; add/remove/move) for select/multiselect/radio, accept + maxSizeMb for file.
  - Sections editor: id + title de/en.
  - Preview: existing `DynamicFields`, de/en toggle, not submittable.
  - Buttons: **Save draft**, **Publish** (save then publish; needs ≥1 field), **Discard draft**. `beforeunload` guard when dirty.
- Version history: published versions open read-only in the preview.

**Actions** (`src/features/forms/admin-actions.ts`): `startFormDraft`, `saveFormDraft(formId, definition, expectedUpdatedAt)`, `publishFormDraft(...)`, `discardFormDraft(formId)`. Save parses with the existing `formDefinition` zod schema; issues return as field errors keyed by path (`fields.3.options`) which the builder maps onto the row and input. Stale `updated_at` (save: `update … where updated_at = expected` matching 0 rows; publish: `P0002`) → `fail("stale")` ("changed by someone else — reload").

Pure helpers in `src/features/forms/builder/model.ts`: `moveField`, `addField(type)`, `removeField`, `suggestKey(label, existingKeys)`, `issuesToFieldErrors`.

## 4. Staff invites

**Guard.** `requireOwner(locale)` in `src/features/admin-auth/session.ts`: `requireAdmin`, then `notFound()` unless role is `owner`. Nav shows "Team" to the owner only.

**Page** `src/app/[locale]/admin/(protected)/team/page.tsx`: admins with display name, email, role, status (`Active` / `Invited — pending` when `last_sign_in_at` is null; read via the auth admin API). Invite form (email, display name). Remove button with confirmation on editor rows only.

**Actions** (`src/features/team/actions.ts`), both start with `requireOwner`:
- `inviteEditor` — `auth.admin.inviteUserByEmail(email, { redirectTo: <origin>/<locale>/admin/set-password })`; then insert the `admins` row (`role editor`) with the **owner's session** so RLS enforces ownership; if that insert fails, `auth.admin.deleteUser` to roll back. Existing email → `fieldErrors.email = ["exists"]`.
- `removeEditor(userId)` — refuses the owner's own id and any owner row; `auth.admin.deleteUser` (the `admins` row cascades). The removed user is locked out on the next request because `getAdminSession` revalidates with `getUser()` and finds no admin row.
- `src/lib/supabase/auth-admin.ts` wraps the service client for `auth.admin.*`; the `service.ts` comment becomes "public submissions and owner-gated user management only".

**Accepting.**
- `supabase/templates/invite.html` + `[auth.email.template.invite]` in `config.toml`: link `{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next={{ .RedirectTo }}` (token-hash flow, required for SSR). Production and local `additional_redirect_urls` must allow `/*/admin/set-password`.
- `src/app/api/auth/confirm/route.ts` (under `/api` so the i18n proxy does not rewrite it): `verifyOtp({ type, token_hash })` sets the session cookie → redirect to `next` only if it is same-origin (full URL or path; otherwise `/de/admin`). On failure → `/<locale>/admin/login?notice=invite_expired`.
- `src/app/[locale]/admin/set-password/page.tsx` (outside `(protected)`, but requires a session that is an admin, else login): new + confirm password, min 12 chars → `updateUser({ password })` → admin home.

## Cross-cutting
- i18n: all new strings in `de.json` and `en.json` under `admin.professions`, `admin.forms`, `admin.team`, `admin.setPassword`.
- Errors: actions return `ActionResult`; forms show inline errors; unexpected DB errors are logged and return `server_error`.
- `database.types.ts` regenerated after the migration.

## Testing
- **Vitest:** profession input schema + `canActivate`; builder `model.ts` helpers; team input schemas; confirm-route `next` validation; cron auth check.
- **pgTAP** (`supabase/tests/`): cleanup functions are service-role only, respect the cutoff, ignore submitted applications and their files; one-draft index; `publish_form_draft` moves `current_form_id` and rejects stale drafts; anon cannot call builder functions; editor cannot write `admins`.
- **Playwright:** `e2e/cleanup.spec.ts` (backdated unsubmitted application + uploaded object are gone after calling the route with the secret; a submitted one survives; wrong/missing secret → 401); `e2e/profession-builder.spec.ts` (create profession → add two fields → publish → activate → `/de/apply/<slug>` shows them); `e2e/team.spec.ts` (owner invites → invite read from local Mailpit → set password → editor lands in admin, gets 404 on `/admin/team` → owner removes → editor is redirected to login).
- `npm run check` and `npm run test:e2e` pass before each commit.

## Pre-production checklist (from this plan)
- `CRON_SECRET` set in Vercel production env; first cron run verified in Vercel logs.
- Privacy policy states unsubmitted applications and uploads are deleted within 48 hours.
- Production Supabase invite email template and redirect URLs configured.
