# iPrince Foundation: StyleX + Supabase, admin-driven professions

## Context
iPrince Recruiting is starting fresh. The current repo (~10.6k lines: Tailwind, a healthcare-flavoured CMS schema, admin pages behind a hardcoded-passcode/localStorage "auth") is being replaced by a clean foundation:
- StyleX replaces Tailwind.
- Supabase handles data, auth and storage. The real project keys arrive later; until then development runs on the local Supabase CLI via Docker.
- Professions are admin-managed data with no fixed industry. Each profession has its own admin-built, versioned application form.
- A new design system arrives later, so this phase ships tokens, primitives and working but unstyled screens, not final visuals.

Success means that on a fresh clone with Docker running, `supabase start` + `npm run dev` give:
- the public `/[de|en]/apply/[profession]` flow, driven by the form the admin built, with file uploads;
- a secure admin area (Supabase Auth, `admins` table, row-level security) for professions and forms, applications, blog, reviews, leads and site content;
- a `npm run check` that passes (tsc, lint, vitest, pgTAP, build).

## Decisions (approved during brainstorming)
- **Clean slate:** delete `src/**` (except i18n config and messages), the old migration, `DESIGN_SYSTEM.md`, Tailwind and the Tailwind PostCSS plugin. Keep `public/icons/*.svg`.
- **Translated content:** JSON fields `{de, en}` (shown as `L` below), enforced by zod.
- **Forms:** JSON definition stored in versioned `profession_forms` rows. Published versions never change.
- **Admin auth:** email + password (Supabase Auth), an `admins(role: owner|editor)` table, no public sign-up (the owner invites staff), and an `is_admin()` / `is_owner()` SQL function used by the security rules.
- **Candidates and employers have no accounts.** Public submissions go through server actions only (service role, after zod validation, a honeypot check and a Postgres rate limit).
- **Next 16:** `src/middleware.ts` becomes `src/proxy.ts` (see `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Proxy does only i18n routing, the Supabase session refresh and an early `/admin` redirect. Real authorization happens in `requireAdmin()` on the server.

## Target structure
```
src/
  proxy.ts
  env.ts                         zod-validated env, fail fast
  app/[locale]/
    layout.tsx, page.tsx (placeholder), not-found.tsx, error.tsx
    apply/[slug]/page.tsx        server: load profession + current form
    admin/login/page.tsx
    admin/(protected)/layout.tsx requireAdmin()
    admin/(protected)/{page, professions/[id]/form, applications/[id], blog, reviews, leads, content, team}/...
  features/<domain>/{schema.ts, queries.ts (server-only), actions.ts ('use server')}
    professions, forms, applications, leads, blog, reviews, site-content, admin-auth
  lib/supabase/{server.ts, browser.ts, service.ts (server-only), proxy.ts, database.types.ts (generated)}
  lib/result.ts                  ActionResult<T> = {ok:true,data} | {ok:false,fieldErrors?,formError}
  lib/rate-limit.ts
  ui/tokens.stylex.ts            placeholder tokens (color, space, radius, font)
  ui/{Button, Input, Field, Select, Stack, Text, Icon}.tsx
  features/forms/DynamicForm.tsx + FormBuilder.tsx
  i18n/ (kept, trimmed messages)
supabase/
  config.toml, migrations/*.sql, seed.sql, tests/*.sql (pgTAP)
```

## Data model (migration `0001_foundation.sql` + `0002_rls.sql` + `0003_storage.sql`)
Every table: `id uuid pk`, `created_at`, `updated_at` (trigger).
- `admins(user_id → auth.users unique, role owner|editor, display_name)`
- `professions(slug unique, name L, summary L, icon, is_featured, is_active, sort_order, open_positions, current_form_id → profession_forms)`
- `profession_forms(profession_id, version, schema jsonb, published_at)`, unique `(profession_id, version)`
- `applications(profession_id, form_id, full_name, email, phone, locale, answers jsonb, status new|reviewing|contacted|placed|rejected|archived, submitted_at, admin_notes)`
- `application_files(application_id, field_key, storage_path, mime, size)`
- `employer_leads(company, contact_name, email, phone, profession_ids uuid[], headcount, message, status, admin_notes)`
- `contact_messages(name, email, message, status)`
- `blog_categories(slug, name L)`; `blog_posts(slug, title L, excerpt L, body L markdown, category_id, cover_path, author_name, status draft|published, published_at, is_featured)`
- `reviews(author_name, role_title L, organisation, rating 1–5, body L, profession_id?, status pending|approved|rejected, is_featured)`
- `site_content(key unique, value jsonb, updated_by)`
- `rate_limits(bucket, key, window_start, count)` + `hit_rate_limit(bucket, key, max, window)` SQL function

**Security rules:**
- anon: read only active professions (and their current form), published posts and their categories, approved reviews, site content. No inserts.
- `is_admin()`: full CRUD everywhere except `admins`, which is owner-only.

**Storage:**
- private `applications` bucket: service-role signed upload URLs; admins read through signed URLs.
- public `blog` bucket: admins write.

**Form definition (zod, `features/forms/schema.ts`):**
`{ sections?: [{id,title L}], fields: [{ key, type: text|textarea|email|tel|select|multiselect|radio|checkbox|date|number|language_level|file, label L, help? L, required, options?: [{value,label L}], accept?, maxSizeMb?, section? }] }`.
`buildAnswerSchema(def)` returns a zod schema used on the server to validate submissions. Name, email and phone are fixed fields outside the definition.

## Key flows
- **Apply:** page loads the active profession and its current form, then renders `<DynamicForm>` (client, native inputs). `submitApplication`:
  1. check the honeypot and rate limit;
  2. parse with `buildAnswerSchema(formVersion)`;
  3. insert the application with `submitted_at = null`;
  4. return signed upload URLs for the file fields.
  The browser then uploads the files directly, and `finalizeApplication(id, files)` checks the storage paths, inserts `application_files` and sets `submitted_at`.
- **Admin:** `requireAdmin()` (`features/admin-auth/queries.ts`) calls `supabase.auth.getUser()` and looks up `admins`, redirecting anyone else to login. It is called in the protected layout and at the top of every admin action. Admin database calls use the user's own session, so the security rules also apply.
- **Form builder:** edit a draft definition, then "Publish" inserts version N+1 and points the profession's `current_form_id` at it. Older applications keep their `form_id`, so the admin can always see the exact questions each applicant answered.
- **Errors:** actions return `ActionResult` and forms show errors inline. `error.tsx` boundaries and `not-found` cover the rest.

## Implementation phases
1. **Clean slate + tooling:** remove old code and Tailwind. Install `@stylexjs/stylex`, `@stylexjs/babel-plugin`, `@stylexjs/postcss-plugin`, `zod`, `vitest`, `@playwright/test` and the `supabase` CLI (dev). Add `babel.config.js` and `postcss.config.js` following the StyleX Next.js guide (`@stylex;` in globals.css). **Verify first that Next 16 Turbopack honours the Babel config** with a single styled test component; if it doesn't, fall back to `next dev --webpack`. Add `env.ts` and the `check` script.
2. **Supabase:** `supabase init`, migrations 0001–0003, `seed.sql` (2 sample professions with forms, an owner admin user, a blog category), `supabase gen types` into `database.types.ts`, and the Supabase client modules plus `proxy.ts`.
3. **i18n:** keep `src/i18n/*`, point it at `proxy.ts`, trim messages to the foundation's strings, and add a `localized(L, locale)` helper with a de fallback.
4. **UI primitives:** `tokens.stylex.ts` + primitives + the `Icon` component (from `public/icons`).
5. **Forms core (TDD):** form-definition schema, `buildAnswerSchema`, `DynamicForm`, with Vitest.
6. **Public apply flow:** page, `submitApplication` / `finalizeApplication`, rate limit, success state.
7. **Admin auth:** login page (email + password server action), `requireAdmin`, protected layout, sign-out, team page (owner invites an editor by email via service role `inviteUserByEmail`).
8. **Admin CRUD:** professions + form builder, applications (list/filter/detail/status/notes/signed file links), blog, reviews, leads + contact messages, site content (JSON editor per key).
9. **Minimal public reads:** home placeholder listing featured professions, plus blog index and post pages.
10. **Tests + docs:** pgTAP security-rule tests, a Playwright smoke test (apply, then an admin sees the application), a README with setup steps, `.env.example`.

Execution: detailed task plan produced via writing-plans; work on the `feat/foundation` branch.

## Verification
- `npx supabase start && npx supabase db reset` applies the migrations and seed cleanly.
- `npx supabase test db`: the pgTAP tests pass. Anonymous users can't select applications or insert anywhere; an editor can't write `admins`; the owner can.
- `npm run check` (tsc, eslint, vitest, next build) passes.
- `npx playwright test`: on `/en/apply/<seed-slug>`, fill the form and upload a PDF, then sign in as the seeded owner and find the application with its file downloadable via signed URL.
- Manual: publish a new form version in the builder, then confirm the apply page shows the new fields and the old application still shows its original questions.
