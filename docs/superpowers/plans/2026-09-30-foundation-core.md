# iPrince Foundation Core Implementation Plan (Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old app with a clean foundation: StyleX, local Supabase (schema, row-level security, storage), i18n, UI primitives, the admin-defined form engine, the public apply flow, admin sign-in and an applications inbox.

**Architecture:** Next 16 App Router under `src/app/[locale]`. Each domain lives in `src/features/<domain>/`, split into pure modules (unit-tested with Vitest, no StyleX, no `server-only`), `queries.ts` (server reads) and `actions.ts` (server actions returning `ActionResult`). Public submissions use the Supabase service role after validation. Admin reads and writes go through the signed-in user's session, so row-level security applies.

**Tech Stack:** Next 16.3 (Turbopack, `proxy.ts`), React 19.2, next-intl 4, StyleX 0.19 (Babel and PostCSS plugins), Supabase (CLI + Docker locally, `@supabase/ssr`), zod 4, Vitest, pgTAP, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-foundation-design.md`

**Out of scope (Plans 2 and 3):** profession management and form-builder UI, blog, reviews, employer leads and contact UIs, site-content editor, team invites. Their **tables and security rules are created here**; only the UI and actions come later.

## Global Constraints

- Read `node_modules/next/dist/docs/` before using any Next API you haven't checked. In Next 16 `middleware.ts` is `proxy.ts`, and `params`/`searchParams` are Promises.
- Translated DB values are `{"de": string, "en": string}` JSON. German is required, and English falls back to German when empty.
- Supported locales are exactly `["en", "de"]`, with default `en` (from `src/i18n/config.ts`).
- Pure modules (`*.ts` with tests) must not import `@stylexjs/stylex`, `server-only`, `next/*` or Supabase clients. StyleX only compiles under Babel, and `server-only` throws in Vitest.
- In zod, use `z.guid()` (not `z.uuid()`) for ids, because seed ids like `00000000-…-0001` aren't RFC-versioned.
- Server actions return `ActionResult<T>` from `src/lib/result.ts` and never throw for expected failures. User-facing errors are **codes** mapped to translations.
- The service-role client (`src/lib/supabase/service.ts`) is used only in public-submission actions and scripts. It is never used in admin code paths and never imported from client components.
- Every admin page or action calls `requireAdmin()` first.
- No Tailwind and no CSS files other than `src/app/globals.css` (which holds only `@stylex;` + a reset).
- Commit after every task. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A client lies about files** (wrong MIME, oversized, skips a required upload, uploads then calls finalize with someone else's path). The server must re-check real storage metadata and required files at finalize. Pinned in Task 8 (`validateFiles`, `isOwnedPath`, `fileMetaFromStorage` tests).
2. **An admin publishes a new form version while an applicant has the page open.** The submission against the older *published* version of the same profession is accepted; a form id from another profession, or an unpublished draft, is rejected. Pinned in Task 8 (`isSubmittableForm` tests).
3. **Blank, whitespace-only or non-numeric answers.** A required field gets error code `required`; a present but wrong value gets `invalid`; empty optional fields are omitted. Pinned in Task 7.
4. **Missing English translation in admin-entered data** renders the German text, never an empty label. Pinned in Task 2.
5. **Double submit, or finalize called twice.** The second call is a no-op success, with no duplicate file rows. Pinned in Task 4 (pgTAP uniqueness on `storage_path`) and Task 8 (finalize short-circuits on `submitted_at`).

---

### Task 1: Clean slate + StyleX toolchain

**Files:**
- Delete: everything under `src/` **except** `src/i18n/` and `src/app/globals.css`. Also delete `supabase/migrations/20260916_admin_cms_schema.sql`, `DESIGN_SYSTEM.md`, `postcss.config.mjs` and `tsconfig.tsbuildinfo`.
- Create: `babel.config.js`, `postcss.config.js`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`
- Modify: `package.json`, `src/app/globals.css`, `eslint.config.mjs`, `.gitignore`, `src/i18n/messages/en.json`, `src/i18n/messages/de.json`

**Interfaces:**
- Produces: working StyleX compile under `next dev` / `next build`; `@/*` → `src/*` alias honoured by StyleX.

- [ ] **Step 1: Delete old code and Tailwind**

```bash
cd /Users/user/Documents/projects/private/i-prince
find src -mindepth 1 -maxdepth 1 ! -name i18n ! -name app -exec rm -rf {} +
find src/app -mindepth 1 ! -name globals.css -exec rm -rf {} + 2>/dev/null; ls src/app
rm -f supabase/migrations/20260916_admin_cms_schema.sql DESIGN_SYSTEM.md postcss.config.mjs tsconfig.tsbuildinfo
npm uninstall tailwindcss @tailwindcss/postcss
npm install @stylexjs/stylex zod server-only
npm install -D @stylexjs/babel-plugin @stylexjs/postcss-plugin autoprefixer
```
Expected: `ls src/app` prints only `globals.css`, and `src/i18n/` still contains `config.ts navigation.ts request.ts routing.ts messages/`.

- [ ] **Step 2: Add Babel + PostCSS config** (the official StyleX Next.js setup; Next 16 Turbopack uses a Babel config automatically when one is present, per `node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md`)

`babel.config.js`:
```js
const path = require("path");
const dev = process.env.NODE_ENV !== "production";

module.exports = {
  presets: ["next/babel"],
  plugins: [
    [
      "@stylexjs/babel-plugin",
      {
        dev,
        runtimeInjection: false,
        enableInlinedConditionalMerge: true,
        treeshakeCompensation: true,
        aliases: { "@/*": [path.join(__dirname, "src", "*")] },
        unstable_moduleResolution: { type: "commonJS", rootDir: __dirname },
      },
    ],
  ],
};
```

`postcss.config.js`:
```js
const babelConfig = require("./babel.config");

module.exports = {
  plugins: {
    "@stylexjs/postcss-plugin": {
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      babelConfig: {
        babelrc: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: babelConfig.plugins,
      },
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
};
```

`src/app/globals.css` (replace entire file):
```css
@stylex;

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; line-height: 1.5; }
```

In `eslint.config.mjs`, add the two CommonJS config files to `globalIgnores`:
```js
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "babel.config.js",
    "postcss.config.js",
    "playwright-report/**",
    "test-results/**",
  ]),
```

Append to `.gitignore`:
```
!.env.example
/test-results/
/playwright-report/
```

- [ ] **Step 3: Trim messages to the foundation's strings**

`src/i18n/messages/en.json` (replace entire file):
```json
{
  "metadata": { "title": "iPrince Recruiting", "description": "International skilled workers for employers in Germany." },
  "site": { "skipLink": "Skip to content", "openPositions": "{count, plural, =0 {No open positions} one {# open position} other {# open positions}}", "apply": "Apply", "noProfessions": "No professions are open for applications right now." },
  "apply": {
    "title": "Apply: {profession}",
    "fullName": "Full name",
    "email": "Email",
    "phone": "Phone (optional)",
    "submit": "Send application",
    "sending": "Sending…",
    "uploading": "Uploading documents…",
    "success": "Thank you! Your application has been received. We will get back to you soon.",
    "requiredHint": "Fields marked * are required.",
    "yes": "Yes",
    "no": "No",
    "choose": "Please choose",
    "errors": {
      "required": "This field is required.",
      "invalid": "Please check this field.",
      "too_large": "The file is too large.",
      "too_many": "Only one file is allowed.",
      "type_not_allowed": "This file type is not allowed.",
      "unknown_field": "Unexpected file.",
      "rate_limited": "Too many attempts. Please try again later.",
      "form_unavailable": "This application form is no longer available. Please reload the page.",
      "upload_missing": "A document upload did not complete. Please try again.",
      "upload_failed": "A document could not be uploaded. Please try again.",
      "server_error": "Something went wrong. Please try again."
    }
  },
  "admin": {
    "signInTitle": "Admin sign-in",
    "email": "Email",
    "password": "Password",
    "signIn": "Sign in",
    "signOut": "Sign out",
    "applications": "Applications",
    "allStatuses": "All statuses",
    "filter": "Filter",
    "empty": "No applications yet.",
    "submittedAt": "Submitted",
    "profession": "Profession",
    "status": "Status",
    "notes": "Internal notes",
    "save": "Save",
    "saved": "Saved.",
    "answers": "Answers",
    "documents": "Documents",
    "back": "Back to applications",
    "statuses": { "new": "New", "reviewing": "Reviewing", "contacted": "Contacted", "placed": "Placed", "rejected": "Rejected", "archived": "Archived" },
    "errors": { "invalid_credentials": "Email or password is incorrect.", "not_admin": "This account has no admin access.", "invalid": "Please check your input.", "server_error": "Something went wrong." }
  },
  "errors": { "notFoundTitle": "Page not found", "genericTitle": "Something went wrong", "retry": "Try again" }
}
```

`src/i18n/messages/de.json` (replace entire file, same keys):
```json
{
  "metadata": { "title": "iPrince Personalvermittlung", "description": "Internationale Fachkräfte für Arbeitgeber in Deutschland." },
  "site": { "skipLink": "Zum Inhalt springen", "openPositions": "{count, plural, =0 {Keine offenen Stellen} one {# offene Stelle} other {# offene Stellen}}", "apply": "Bewerben", "noProfessions": "Derzeit sind keine Berufe für Bewerbungen geöffnet." },
  "apply": {
    "title": "Bewerbung: {profession}",
    "fullName": "Vollständiger Name",
    "email": "E-Mail",
    "phone": "Telefon (optional)",
    "submit": "Bewerbung absenden",
    "sending": "Wird gesendet…",
    "uploading": "Dokumente werden hochgeladen…",
    "success": "Vielen Dank! Ihre Bewerbung ist eingegangen. Wir melden uns in Kürze.",
    "requiredHint": "Mit * markierte Felder sind Pflichtfelder.",
    "yes": "Ja",
    "no": "Nein",
    "choose": "Bitte wählen",
    "errors": {
      "required": "Dieses Feld ist erforderlich.",
      "invalid": "Bitte prüfen Sie dieses Feld.",
      "too_large": "Die Datei ist zu groß.",
      "too_many": "Es ist nur eine Datei erlaubt.",
      "type_not_allowed": "Dieser Dateityp ist nicht erlaubt.",
      "unknown_field": "Unerwartete Datei.",
      "rate_limited": "Zu viele Versuche. Bitte später erneut versuchen.",
      "form_unavailable": "Dieses Formular ist nicht mehr verfügbar. Bitte laden Sie die Seite neu.",
      "upload_missing": "Ein Dokument wurde nicht vollständig hochgeladen. Bitte erneut versuchen.",
      "upload_failed": "Ein Dokument konnte nicht hochgeladen werden. Bitte erneut versuchen.",
      "server_error": "Etwas ist schiefgelaufen. Bitte erneut versuchen."
    }
  },
  "admin": {
    "signInTitle": "Admin-Anmeldung",
    "email": "E-Mail",
    "password": "Passwort",
    "signIn": "Anmelden",
    "signOut": "Abmelden",
    "applications": "Bewerbungen",
    "allStatuses": "Alle Status",
    "filter": "Filtern",
    "empty": "Noch keine Bewerbungen.",
    "submittedAt": "Eingegangen",
    "profession": "Beruf",
    "status": "Status",
    "notes": "Interne Notizen",
    "save": "Speichern",
    "saved": "Gespeichert.",
    "answers": "Antworten",
    "documents": "Dokumente",
    "back": "Zurück zu den Bewerbungen",
    "statuses": { "new": "Neu", "reviewing": "In Prüfung", "contacted": "Kontaktiert", "placed": "Vermittelt", "rejected": "Abgelehnt", "archived": "Archiviert" },
    "errors": { "invalid_credentials": "E-Mail oder Passwort ist falsch.", "not_admin": "Dieses Konto hat keinen Admin-Zugang.", "invalid": "Bitte prüfen Sie Ihre Eingaben.", "server_error": "Etwas ist schiefgelaufen." }
  },
  "errors": { "notFoundTitle": "Seite nicht gefunden", "genericTitle": "Etwas ist schiefgelaufen", "retry": "Erneut versuchen" }
}
```

- [ ] **Step 4: Minimal layout + StyleX smoke page**

`src/app/[locale]/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("site");

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <a href="#main">{t("skipLink")}</a>
          <main id="main">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

`src/app/[locale]/page.tsx` (temporary; replaced in Task 6):
```tsx
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({ probe: { color: "rgb(200, 0, 0)" } });

export default function Home() {
  return <p {...stylex.props(styles.probe)} data-testid="stylex-probe">StyleX works</p>;
}
```

- [ ] **Step 5: Verify StyleX compiles under Turbopack**

Run: `npm run build`
Expected: build succeeds. Then run `grep -r "rgb(200, 0, 0)\|rgb(200,0,0)" .next/static/css | head -1`.
Expected: one match (the generated atomic class).

If the build fails with "stylex.create should never be called at runtime" or no CSS match, Turbopack isn't applying Babel. In that case change the scripts in `package.json` to `"dev": "next dev --webpack"` and `"build": "next build --webpack"`, re-run, and record the fallback in the README (Task 12).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: clean slate and StyleX toolchain

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Test runner, env, result type, translation helper

**Files:**
- Create: `vitest.config.ts`, `src/env.ts`, `src/env.test.ts`, `src/lib/result.ts`, `src/lib/result.test.ts`, `src/lib/i18n/localized.ts`, `src/lib/i18n/localized.test.ts`, `.env.example`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces:
  - `readPublicEnv(): { NEXT_PUBLIC_SUPABASE_URL: string; NEXT_PUBLIC_SUPABASE_ANON_KEY: string }`
  - `readServerEnv(): PublicEnv & { SUPABASE_SERVICE_ROLE_KEY: string }`
  - `type FieldErrors = Record<string, string[]>`
  - `type Failure = { ok: false; formError?: string; fieldErrors?: FieldErrors }`
  - `type ActionResult<T> = { ok: true; data: T } | Failure`
  - `ok<T>(data: T): ActionResult<T>`
  - `fail(formError?: string, fieldErrors?: FieldErrors): Failure`
  - `localizedText` (zod schema), `type LocalizedText = { de: string; en: string }`, `localized(value: LocalizedText | null | undefined, locale: Locale): string`

- [ ] **Step 1: Install Vitest and add scripts**

```bash
npm install -D vitest
```
Set `scripts` in `package.json` to:
```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "eslint",
"typecheck": "tsc --noEmit",
"test": "vitest run",
"test:db": "supabase test db",
"test:e2e": "playwright test",
"db:env": "sh scripts/local-env.sh",
"db:types": "supabase gen types typescript --local > src/lib/supabase/database.types.ts",
"admin:create": "tsx --env-file=.env.local scripts/create-admin.ts",
"check": "npm run typecheck && npm run lint && npm run test && npm run test:db && npm run build"
```
(Keep the `--webpack` flags on `dev`/`build` if Task 1 needed the fallback.)

`vitest.config.ts`:
```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
```

- [ ] **Step 2: Write failing tests**

`src/env.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { readPublicEnv, readServerEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("env", () => {
  it("reads valid public env", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    expect(readPublicEnv()).toEqual({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" });
  });

  it("names every missing variable", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not a url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => readServerEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL.*SUPABASE_SERVICE_ROLE_KEY/);
  });
});
```

`src/lib/result.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { fail, ok } from "./result";

describe("result", () => {
  it("wraps data", () => expect(ok(1)).toEqual({ ok: true, data: 1 }));
  it("wraps errors", () =>
    expect(fail("rate_limited", { email: ["invalid"] })).toEqual({ ok: false, formError: "rate_limited", fieldErrors: { email: ["invalid"] } }));
});
```

`src/lib/i18n/localized.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { localized, localizedText } from "./localized";

describe("localized", () => {
  it("returns the requested locale", () => expect(localized({ de: "Pflege", en: "Nursing" }, "en")).toBe("Nursing"));
  it("falls back to German when English is blank", () => expect(localized({ de: "Pflege", en: "  " }, "en")).toBe("Pflege"));
  it("handles null", () => expect(localized(null, "de")).toBe(""));
});

describe("localizedText", () => {
  it("requires German", () => expect(localizedText.safeParse({ de: " ", en: "x" }).success).toBe(false));
  it("defaults English to empty", () => expect(localizedText.parse({ de: "Pflege" })).toEqual({ de: "Pflege", en: "" }));
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, because the modules `./env`, `./result` and `./localized` are not found.

- [ ] **Step 4: Implement**

`src/env.ts`:
```ts
import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});
const serverSchema = publicSchema.extend({ SUPABASE_SERVICE_ROLE_KEY: z.string().min(1) });

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new Error(`Invalid environment variables: ${names}. See .env.example.`);
  }
  return result.data;
}

// NEXT_PUBLIC_* must be referenced literally so Next inlines them into client bundles.
export function readPublicEnv(): PublicEnv {
  return parse(publicSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function readServerEnv(): ServerEnv {
  return parse(serverSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
```

`src/lib/result.ts`:
```ts
export type FieldErrors = Record<string, string[]>;
export type Failure = { ok: false; formError?: string; fieldErrors?: FieldErrors };
export type ActionResult<T> = { ok: true; data: T } | Failure;

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(formError?: string, fieldErrors?: FieldErrors): Failure {
  return { ok: false, formError, fieldErrors };
}
```

`src/lib/i18n/localized.ts`:
```ts
import { z } from "zod";
import type { Locale } from "@/i18n/config";

export const localizedText = z.object({
  de: z.string().trim().min(1),
  en: z.string().trim().default(""),
});
export type LocalizedText = z.infer<typeof localizedText>;

export function localized(value: LocalizedText | null | undefined, locale: Locale): string {
  if (!value) return "";
  const text = value[locale]?.trim();
  return text ? text : value.de;
}
```

`.env.example` (replace):
```
# Local development: run `npx supabase start && npm run db:env` to generate .env.local.
# Production: copy these from the Supabase dashboard → Project Settings → API.
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Server-only. Never expose to the browser.
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test && npm run typecheck`
Expected: 9 tests pass and tsc reports no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: env validation, action result type, localized text helper

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 3: Local Supabase + schema migration

**Files:**
- Create: `supabase/config.toml` (via CLI), `supabase/migrations/20260930000001_foundation.sql`, `scripts/local-env.sh`
- Modify: `package.json` (dev dep `supabase`), `.env.local` (generated, gitignored)

**Interfaces:**
- Produces:
  - Tables: `admins`, `professions`, `profession_forms`, `applications`, `application_files`, `employer_leads`, `contact_messages`, `blog_categories`, `blog_posts`, `reviews`, `site_content`, `rate_limits`.
  - Enums: `admin_role`, `application_status`, `lead_status`, `message_status`, `post_status`, `review_status`.
  - Function `public.hit_rate_limit(p_bucket text, p_key text, p_max int, p_window_seconds int) returns boolean` (true means allowed; service_role only).

- [ ] **Step 1: Install and initialise the CLI**

```bash
npm install -D supabase tsx
npx supabase init --with-vscode-settings=false --with-intellij-settings=false
```
In `supabase/config.toml` set, under `[auth]`:
```toml
enable_signup = false
```
Also check that `[db.seed]` has `enabled = true` and `sql_paths = ["./seed.sql"]` (the defaults).

- [ ] **Step 2: Write the schema migration**

`supabase/migrations/20260930000001_foundation.sql`:
```sql
-- iPrince foundation schema. Translated fields are jsonb {"de": text, "en": text}.

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create type public.admin_role as enum ('owner', 'editor');
create type public.application_status as enum ('new', 'reviewing', 'contacted', 'placed', 'rejected', 'archived');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'closed', 'archived');
create type public.message_status as enum ('new', 'read', 'archived');
create type public.post_status as enum ('draft', 'published');
create type public.review_status as enum ('pending', 'approved', 'rejected');

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role public.admin_role not null default 'editor',
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (jsonb_typeof(name) = 'object' and name ? 'de'),
  summary jsonb not null default '{"de": "", "en": ""}',
  icon text not null default 'briefcase',
  is_featured boolean not null default false,
  is_active boolean not null default false,
  sort_order int not null default 0,
  open_positions int not null default 0 check (open_positions >= 0),
  current_form_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profession_forms (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid not null references public.professions (id) on delete cascade,
  version int not null check (version > 0),
  schema jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profession_id, version),
  unique (id, profession_id)
);

-- The current form must belong to the same profession (composite FK).
alter table public.professions
  add constraint professions_current_form_fk
  foreign key (current_form_id, id) references public.profession_forms (id, profession_id)
  on delete set null (current_form_id);

create or replace function public.forbid_published_form_change() returns trigger
language plpgsql as $$
begin
  if old.published_at is not null then
    raise exception 'published form versions are immutable' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger profession_forms_immutable
  before update on public.profession_forms
  for each row execute function public.forbid_published_form_change();

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid not null references public.professions (id) on delete restrict,
  form_id uuid not null references public.profession_forms (id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text,
  locale text not null check (locale in ('de', 'en')),
  answers jsonb not null default '{}',
  status public.application_status not null default 'new',
  submitted_at timestamptz,
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_inbox_idx on public.applications (status, submitted_at desc);
create index applications_profession_idx on public.applications (profession_id);

create table public.application_files (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  field_key text not null,
  storage_path text not null unique,
  mime text not null,
  size bigint not null check (size > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index application_files_application_idx on public.application_files (application_id);

create table public.employer_leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text not null,
  email text not null,
  phone text,
  profession_ids uuid[] not null default '{}',
  headcount int check (headcount is null or headcount > 0),
  message text not null default '',
  status public.lead_status not null default 'new',
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status public.message_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (name ? 'de'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title jsonb not null check (title ? 'de'),
  excerpt jsonb not null default '{"de": "", "en": ""}',
  body jsonb not null default '{"de": "", "en": ""}',
  category_id uuid references public.blog_categories (id) on delete set null,
  cover_path text,
  author_name text not null default 'iPrince',
  status public.post_status not null default 'draft',
  published_at timestamptz,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_published_idx on public.blog_posts (status, published_at desc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  role_title jsonb not null default '{"de": "", "en": ""}',
  organisation text,
  rating int not null check (rating between 1 and 5),
  body jsonb not null check (body ? 'de'),
  profession_id uuid references public.professions (id) on delete set null,
  status public.review_status not null default 'pending',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['admins', 'professions', 'profession_forms', 'applications', 'application_files',
    'employer_leads', 'contact_messages', 'blog_categories', 'blog_posts', 'reviews', 'site_content'] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t);
  end loop;
end $$;

-- Fixed-window rate limiting for public submissions.
create table public.rate_limits (
  bucket text not null,
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (bucket, key, window_start)
);

create or replace function public.hit_rate_limit(p_bucket text, p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count int;
begin
  insert into public.rate_limits (bucket, key, window_start, count)
  values (p_bucket, p_key, v_window, 1)
  on conflict (bucket, key, window_start) do update set count = public.rate_limits.count + 1
  returning count into v_count;

  delete from public.rate_limits where window_start < now() - interval '1 day';
  return v_count <= p_max;
end $$;

revoke execute on function public.hit_rate_limit(text, text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, text, int, int) to service_role;
```

- [ ] **Step 3: Add the env generator script**

`scripts/local-env.sh`:
```sh
#!/bin/sh
# Writes .env.local from the running local Supabase stack.
set -e
if [ -f .env.local ]; then cp .env.local .env.local.bak; fi
npx supabase status -o env | tr -d '"' | awk '
  /^API_URL=/          { sub(/^API_URL=/, "");          print "NEXT_PUBLIC_SUPABASE_URL=" $0 }
  /^ANON_KEY=/         { sub(/^ANON_KEY=/, "");         print "NEXT_PUBLIC_SUPABASE_ANON_KEY=" $0 }
  /^SERVICE_ROLE_KEY=/ { sub(/^SERVICE_ROLE_KEY=/, ""); print "SUPABASE_SERVICE_ROLE_KEY=" $0 }
' > .env.local
echo "Wrote .env.local (previous copy saved as .env.local.bak if it existed)"
```

- [ ] **Step 4: Apply and verify**

```bash
npx supabase start
npx supabase db reset
npm run db:env && cat .env.local | cut -c1-40
npx supabase db lint --level warning
```
Expected:
- `db reset` finishes with "Finished supabase db reset", with no SQL errors.
- `.env.local` has three lines.
- `db lint` reports no errors.

If your CLI version prints `PUBLISHABLE_KEY`/`SECRET_KEY` instead of `ANON_KEY`/`SERVICE_ROLE_KEY`, adjust the two awk patterns to match.

- [ ] **Step 5: Commit**

```bash
git add supabase scripts/local-env.sh package.json package-lock.json
git commit -m "feat(db): foundation schema and local Supabase setup

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Row-level security, storage buckets, pgTAP tests

**Files:**
- Create: `supabase/migrations/20260930000002_rls.sql`, `supabase/migrations/20260930000003_storage.sql`, `supabase/tests/database/rls.test.sql`

**Interfaces:**
- Consumes: the tables from Task 3.
- Produces:
  - `public.is_admin(): boolean` and `public.is_owner(): boolean`.
  - Storage buckets `applications` (private, 20 MB) and `blog` (public, 5 MB).
  - `public.storage_object_meta(p_bucket text, p_path text) returns jsonb` (the storage `metadata` with `size` and `mimetype`; service_role only).

- [ ] **Step 1: Write the failing pgTAP test**

`supabase/tests/database/rls.test.sql`:
```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

-- Fixtures (run as postgres, which bypasses RLS)
insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('10000000-0000-0000-0000-000000000002', 'editor@test.local'),
  ('10000000-0000-0000-0000-000000000003', 'stranger@test.local');
insert into public.admins (user_id, role, display_name) values
  ('10000000-0000-0000-0000-000000000001', 'owner', 'Owner'),
  ('10000000-0000-0000-0000-000000000002', 'editor', 'Editor');

insert into public.professions (id, slug, name, is_active) values
  ('20000000-0000-0000-0000-000000000001', 'test-active', '{"de":"Aktiv","en":""}', true),
  ('20000000-0000-0000-0000-000000000002', 'test-hidden', '{"de":"Versteckt","en":""}', false);
insert into public.profession_forms (id, profession_id, version, schema, published_at) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1, '{"fields":[]}', now()),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 2, '{"fields":[]}', now());
update public.professions set current_form_id = '30000000-0000-0000-0000-000000000002'
  where id = '20000000-0000-0000-0000-000000000001';
insert into public.applications (id, profession_id, form_id, full_name, email, locale) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'A', 'a@test.local', 'en');
insert into public.blog_posts (slug, title, status) values ('test-draft', '{"de":"Entwurf"}', 'draft');

-- Anonymous visitor
set local role anon;
select is((select count(*)::int from public.professions where slug = 'test-active'), 1, 'anon sees active profession');
select is((select count(*)::int from public.professions where slug = 'test-hidden'), 0, 'anon cannot see inactive profession');
select is((select count(*)::int from public.profession_forms where id = '30000000-0000-0000-0000-000000000002'), 1, 'anon sees current form');
select is((select count(*)::int from public.profession_forms where id = '30000000-0000-0000-0000-000000000001'), 0, 'anon cannot see superseded form');
select is_empty($$select id from public.applications$$, 'anon cannot read applications');
select throws_ok(
  $$insert into public.applications (profession_id, form_id, full_name, email, locale)
    values ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'X', 'x@x.x', 'en')$$,
  '42501', null, 'anon cannot insert applications');
select is_empty($$select id from public.blog_posts where slug = 'test-draft'$$, 'anon cannot read draft posts');
select throws_ok($$select public.hit_rate_limit('t', 'k', 1, 60)$$, '42501', null, 'anon cannot call hit_rate_limit');
select throws_ok($$select public.storage_object_meta('applications', 'x')$$, '42501', null, 'anon cannot call storage_object_meta');
reset role;

-- Signed-in non-admin
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is_empty($$select id from public.applications$$, 'non-admin user cannot read applications');
reset role;

-- Editor
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is((select count(*)::int from public.applications where id = '40000000-0000-0000-0000-000000000001'), 1, 'editor reads applications');
select throws_ok(
  $$insert into public.admins (user_id, role, display_name) values ('10000000-0000-0000-0000-000000000003', 'editor', 'X')$$,
  '42501', null, 'editor cannot add admins');
reset role;

-- Owner
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';
select lives_ok(
  $$insert into public.admins (user_id, role, display_name) values ('10000000-0000-0000-0000-000000000003', 'editor', 'New')$$,
  'owner can add admins');
reset role;

-- Invariants
select throws_ok(
  $$update public.profession_forms set schema = '{"fields":[{"key":"x"}]}' where id = '30000000-0000-0000-0000-000000000001'$$,
  'P0001', 'published form versions are immutable', 'published forms are immutable');
select col_is_unique('public', 'application_files', 'storage_path', 'file paths are unique (idempotent finalize)');

set local role service_role;
select is(
  array[public.hit_rate_limit('t', 'k', 2, 3600), public.hit_rate_limit('t', 'k', 2, 3600), public.hit_rate_limit('t', 'k', 2, 3600)],
  array[true, true, false], 'rate limit blocks the third hit');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx supabase test db`
Expected: FAIL. The anon read/insert assertions fail because RLS is off (anon sees `test-hidden`), and `storage_object_meta` does not exist.

- [ ] **Step 3: Write the RLS migration**

`supabase/migrations/20260930000002_rls.sql`:
```sql
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()) and role = 'owner');
$$;

do $$
declare t text;
begin
  foreach t in array array['admins', 'professions', 'profession_forms', 'applications', 'application_files',
    'employer_leads', 'contact_messages', 'blog_categories', 'blog_posts', 'reviews', 'site_content', 'rate_limits'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  -- Admins (owner or editor) get full access to everything except the admins table itself.
  foreach t in array array['professions', 'profession_forms', 'applications', 'application_files',
    'employer_leads', 'contact_messages', 'blog_categories', 'blog_posts', 'reviews', 'site_content'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      t || '_admin_all', t);
  end loop;
end $$;

create policy admins_admin_read on public.admins
  for select to authenticated using ((select public.is_admin()));
create policy admins_owner_write on public.admins
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

-- Public reads. There are no public insert policies: submissions go through server actions using the service role.
create policy professions_public_read on public.professions
  for select to anon, authenticated using (is_active);
create policy profession_forms_public_read on public.profession_forms
  for select to anon, authenticated using (
    exists (select 1 from public.professions p where p.current_form_id = profession_forms.id and p.is_active)
  );
create policy blog_categories_public_read on public.blog_categories
  for select to anon, authenticated using (true);
create policy blog_posts_public_read on public.blog_posts
  for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy reviews_public_read on public.reviews
  for select to anon, authenticated using (status = 'approved');
create policy site_content_public_read on public.site_content
  for select to anon, authenticated using (true);
-- rate_limits: no policies (only the service role, which bypasses RLS, touches it).
```

- [ ] **Step 4: Write the storage migration**

`supabase/migrations/20260930000003_storage.sql`:
```sql
insert into storage.buckets (id, name, public, file_size_limit)
values ('applications', 'applications', false, 20971520),
       ('blog', 'blog', true, 5242880)
on conflict (id) do nothing;

-- Applicant uploads use service-role signed upload URLs, so there is no public insert policy.
create policy "applications bucket: admins read" on storage.objects
  for select to authenticated using (bucket_id = 'applications' and (select public.is_admin()));
create policy "applications bucket: admins delete" on storage.objects
  for delete to authenticated using (bucket_id = 'applications' and (select public.is_admin()));
create policy "blog bucket: admins write" on storage.objects
  for all to authenticated
  using (bucket_id = 'blog' and (select public.is_admin()))
  with check (bucket_id = 'blog' and (select public.is_admin()));

-- Lets finalizeApplication verify what was actually uploaded (real size and MIME).
create or replace function public.storage_object_meta(p_bucket text, p_path text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select metadata from storage.objects where bucket_id = p_bucket and name = p_path;
$$;
revoke execute on function public.storage_object_meta(text, text) from public, anon, authenticated;
grant execute on function public.storage_object_meta(text, text) to service_role;
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx supabase db reset && npx supabase test db`
Expected: `rls.test.sql .. ok`, with all 16 tests passing.

- [ ] **Step 6: Commit**

```bash
git add supabase
git commit -m "feat(db): row-level security, storage buckets, pgTAP policy tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 5: Seed data, generated types, Supabase clients, proxy, admin script

**Files:**
- Create: `supabase/seed.sql`, `src/lib/supabase/database.types.ts` (generated), `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`, `src/lib/supabase/service.ts`, `src/lib/supabase/proxy.ts`, `src/proxy.ts`, `src/features/admin-auth/paths.ts`, `src/features/admin-auth/paths.test.ts`, `scripts/lib/ensure-admin.ts`, `scripts/create-admin.ts`

**Interfaces:**
- Consumes: `readPublicEnv`, `readServerEnv` (Task 2).
- Produces:
  - `type Database` (generated).
  - `createServerSupabase(): Promise<SupabaseClient<Database>>` (cookie session, for server components and actions).
  - `createBrowserSupabase(): SupabaseClient<Database>`.
  - `createServiceSupabase(): SupabaseClient<Database>` (service role, `server-only`).
  - `type ServiceClient = ReturnType<typeof createServiceSupabase>`.
  - `updateSession(request: NextRequest, response: NextResponse): Promise<{ response: NextResponse; userId: string | null }>`.
  - `isProtectedAdminPath(pathname: string): boolean` and `adminLoginPath(pathname: string): string`.
  - `ensureAdmin(opts: { email: string; password: string; role: "owner" | "editor"; displayName: string }): Promise<string>` (returns the user id).
  - Seed professions `pflege` and `elektro`, each active with a published v1 form.

- [ ] **Step 1: Write the seed**

`supabase/seed.sql`:
```sql
-- Sample professions for local development. Admins manage the real ones.
insert into public.professions (id, slug, name, summary, icon, is_featured, is_active, sort_order, open_positions) values
  ('a0000000-0000-4000-8000-000000000001', 'pflege',
   '{"de":"Pflege & Gesundheit","en":"Nursing & healthcare"}',
   '{"de":"Pflegefachkräfte für Kliniken und Einrichtungen.","en":"Registered nurses for hospitals and care homes."}',
   'heart-handshake', true, true, 1, 24),
  ('a0000000-0000-4000-8000-000000000002', 'elektro',
   '{"de":"Elektro- und Anlagentechnik","en":"Electrical & plant engineering"}',
   '{"de":"Elektroniker:innen und Anlagenmechaniker:innen.","en":"Electricians and plant mechanics."}',
   'zap', true, true, 2, 11);

insert into public.profession_forms (id, profession_id, version, published_at, schema) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 1, now(), '{
    "fields": [
      {"key":"german_level","type":"language_level","required":true,"label":{"de":"Deutschniveau","en":"German level"}},
      {"key":"experience_years","type":"number","required":true,"label":{"de":"Berufserfahrung (Jahre)","en":"Years of experience"}},
      {"key":"specialisation","type":"select","required":true,"label":{"de":"Fachbereich","en":"Specialisation"},
       "options":[{"value":"intensive","label":{"de":"Intensivpflege","en":"Intensive care"}},
                  {"value":"general","label":{"de":"Allgemeine Pflege","en":"General nursing"}},
                  {"value":"geriatric","label":{"de":"Altenpflege","en":"Geriatric care"}}]},
      {"key":"recognition_started","type":"checkbox","required":false,"label":{"de":"Anerkennungsverfahren bereits begonnen","en":"Recognition process already started"}},
      {"key":"motivation","type":"textarea","required":false,"label":{"de":"Motivation","en":"Motivation"}},
      {"key":"cv","type":"file","required":true,"accept":["application/pdf"],"maxSizeMb":10,"label":{"de":"Lebenslauf (PDF)","en":"CV (PDF)"}}
    ]}'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 1, now(), '{
    "fields": [
      {"key":"german_level","type":"language_level","required":true,"label":{"de":"Deutschniveau","en":"German level"}},
      {"key":"trade","type":"radio","required":true,"label":{"de":"Beruf","en":"Trade"},
       "options":[{"value":"electrician","label":{"de":"Elektroniker:in","en":"Electrician"}},
                  {"value":"mechanic","label":{"de":"Anlagenmechaniker:in","en":"Plant mechanic"}}]},
      {"key":"certificates","type":"file","required":false,"accept":["application/pdf","image/*"],"maxSizeMb":10,"label":{"de":"Zeugnisse","en":"Certificates"}}
    ]}');

update public.professions set current_form_id = 'b0000000-0000-4000-8000-000000000001' where slug = 'pflege';
update public.professions set current_form_id = 'b0000000-0000-4000-8000-000000000002' where slug = 'elektro';

insert into public.blog_categories (slug, name) values ('karriere', '{"de":"Karriere","en":"Careers"}');
```

- [ ] **Step 2: Reset and generate types**

```bash
npx supabase db reset && npx supabase test db
npm run db:types
grep -c "hit_rate_limit\|storage_object_meta\|application_status" src/lib/supabase/database.types.ts
```
Expected: the reset succeeds, the tests still pass, and grep prints a count ≥ 3.

- [ ] **Step 3: Write the failing admin-path test**

`src/features/admin-auth/paths.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { adminLoginPath, isProtectedAdminPath } from "./paths";

describe("isProtectedAdminPath", () => {
  it.each([
    ["/en/admin", true],
    ["/de/admin/applications/1", true],
    ["/en/admin/login", false],
    ["/en/administrator", false],
    ["/en/apply/pflege", false],
  ])("%s → %s", (path, expected) => expect(isProtectedAdminPath(path)).toBe(expected));
});

describe("adminLoginPath", () => {
  it("keeps the locale", () => expect(adminLoginPath("/de/admin/applications")).toBe("/de/admin/login"));
});
```
Run `npm test`. Expected: FAIL, because `./paths` is not found.

- [ ] **Step 4: Implement paths + clients + proxy**

`src/features/admin-auth/paths.ts`:
```ts
const PROTECTED = /^\/(de|en)\/admin(?!\/login)(\/|$)/;

export function isProtectedAdminPath(pathname: string): boolean {
  return PROTECTED.test(pathname);
}

export function adminLoginPath(pathname: string): string {
  const locale = pathname.split("/")[1];
  return `/${locale}/admin/login`;
}
```

`src/lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readPublicEnv } from "@/env";
import type { Database } from "./database.types";

export async function createServerSupabase() {
  const env = readPublicEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
```

`src/lib/supabase/browser.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";
import { readPublicEnv } from "@/env";
import type { Database } from "./database.types";

export function createBrowserSupabase() {
  const env = readPublicEnv();
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
```

`src/lib/supabase/service.ts`:
```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/env";
import type { Database } from "./database.types";

/** Bypasses RLS. Only for validated public submissions; never for admin code paths. */
export function createServiceSupabase() {
  const env = readServerEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type ServiceClient = ReturnType<typeof createServiceSupabase>;
```

`src/lib/supabase/proxy.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { readPublicEnv } from "@/env";
import type { Database } from "./database.types";

/** Refreshes the auth session cookies on `response` and reports who is signed in. */
export async function updateSession(request: NextRequest, response: NextResponse) {
  const env = readPublicEnv();
  const supabase = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  return { response, userId: data.user?.id ?? null };
}
```

`src/proxy.ts`:
```ts
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { adminLoginPath, isProtectedAdminPath } from "@/features/admin-auth/paths";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const handleI18n = createMiddleware(routing);

// Optimistic check only. Real authorization is requireAdmin() on the server.
export default async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request, handleI18n(request));
  const { pathname } = request.nextUrl;
  if (!userId && isProtectedAdminPath(pathname)) {
    return NextResponse.redirect(new URL(adminLoginPath(pathname), request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 5: Admin bootstrap script**

`scripts/lib/ensure-admin.ts`:
```ts
import { createClient } from "@supabase/supabase-js";

type Options = { email: string; password: string; role: "owner" | "editor"; displayName: string };

/** Creates (or reuses) an auth user and upserts its admins row. Returns the user id. */
export async function ensureAdmin({ email, password, role, displayName }: Options): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  let userId = list.users.find((u) => u.email === email)?.id;
  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    userId = data.user.id;
  }

  const { error } = await supabase
    .from("admins")
    .upsert({ user_id: userId, role, display_name: displayName }, { onConflict: "user_id" });
  if (error) throw error;
  return userId;
}
```

`scripts/create-admin.ts`:
```ts
import { parseArgs } from "node:util";
import { ensureAdmin } from "./lib/ensure-admin";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    password: { type: "string" },
    role: { type: "string", default: "owner" },
    name: { type: "string", default: "Owner" },
  },
});

if (!values.email || !values.password || (values.role !== "owner" && values.role !== "editor")) {
  console.error("Usage: npm run admin:create -- --email you@example.com --password '…' [--role owner|editor] [--name 'Display Name']");
  process.exit(1);
}

ensureAdmin({ email: values.email, password: values.password, role: values.role, displayName: values.name! })
  .then((id) => console.log(`Admin ready: ${values.email} (${values.role}) → ${id}`))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

- [ ] **Step 6: Verify**

```bash
npm test && npm run typecheck
npm run admin:create -- --email owner@iprince.local --password 'local-dev-password' --role owner --name 'Local Owner'
```
Expected: 15 tests pass (9 + 6), tsc is clean, and the script prints `Admin ready: owner@iprince.local (owner) → <uuid>`. Running the script a second time prints the same id.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: seed data, typed Supabase clients, proxy, admin bootstrap script

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 6: StyleX tokens, UI primitives, home page

**Files:**
- Create: `src/ui/tokens.stylex.ts`, `src/ui/Stack.tsx`, `src/ui/Text.tsx`, `src/ui/Button.tsx`, `src/ui/Field.tsx`, `src/ui/inputs.tsx`, `src/ui/Icon.tsx`, `src/features/professions/queries.ts`, `src/app/[locale]/not-found.tsx`, `src/app/[locale]/error.tsx`
- Modify: `src/app/[locale]/page.tsx` (replace the Task 1 probe), `src/app/[locale]/layout.tsx` (body styles)

**Interfaces:**
- Consumes: `createServerSupabase` (Task 5), `localized`, `localizedText` (Task 2).
- Produces:
  - Tokens: `color`, `space`, `radius`, `font` (StyleX vars).
  - `<Stack gap="xs|sm|md|lg|xl" direction="column|row" as? xstyle?>`
  - `<Text as="p|h1|h2|h3|span" size="sm|md|lg|xl" tone="default|muted|danger|success">`
  - `<Button variant="primary|secondary">` (spreads button attrs)
  - `<Field id label required? help? errors?: string[] children>` (renders label, help and errors; errors get `role="alert"`)
  - `<Input>`, `<Textarea>`, `<Select>` (spread native attrs, plus `invalid?: boolean` which sets `aria-invalid`)
  - `<Icon name size?>`
  - `listActiveProfessions(): Promise<ProfessionCard[]>`, where `type ProfessionCard = { slug: string; name: LocalizedText; icon: string; openPositions: number }`.

- [ ] **Step 1: Tokens** (placeholder values, swapped when the design system arrives)

`src/ui/tokens.stylex.ts`:
```ts
import * as stylex from "@stylexjs/stylex";

export const color = stylex.defineVars({
  bg: "#ffffff",
  surface: "#f5f5f3",
  text: "#161616",
  textMuted: "#5c5c5c",
  border: "#d0d0cc",
  accent: "#1f4fd1",
  accentText: "#ffffff",
  danger: "#b3261e",
  success: "#1e7a3c",
});

export const space = stylex.defineVars({ xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "40px" });
export const radius = stylex.defineVars({ sm: "4px", md: "8px" });
export const font = stylex.defineVars({
  body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  sizeSm: "0.875rem",
  sizeMd: "1rem",
  sizeLg: "1.25rem",
  sizeXl: "1.75rem",
});
```

- [ ] **Step 2: Primitives**

`src/ui/Stack.tsx`:
```tsx
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { space } from "./tokens.stylex";

const styles = stylex.create({
  base: { display: "flex" },
  column: { flexDirection: "column" },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  xs: { gap: space.xs },
  sm: { gap: space.sm },
  md: { gap: space.md },
  lg: { gap: space.lg },
  xl: { gap: space.xl },
});

type Props = {
  children: ReactNode;
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  direction?: "column" | "row";
  as?: "div" | "section" | "ul" | "form" | "header" | "nav";
  xstyle?: stylex.StyleXStyles;
};

export function Stack({ children, gap = "md", direction = "column", as: Tag = "div", xstyle }: Props) {
  return <Tag {...stylex.props(styles.base, styles[direction], styles[gap], xstyle)}>{children}</Tag>;
}
```

`src/ui/Text.tsx`:
```tsx
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { color, font } from "./tokens.stylex";

const styles = stylex.create({
  base: { margin: 0, fontFamily: font.body },
  sm: { fontSize: font.sizeSm },
  md: { fontSize: font.sizeMd },
  lg: { fontSize: font.sizeLg, fontWeight: 600 },
  xl: { fontSize: font.sizeXl, fontWeight: 700, lineHeight: 1.2 },
  default: { color: color.text },
  muted: { color: color.textMuted },
  danger: { color: color.danger },
  success: { color: color.success },
});

type Props = {
  children: ReactNode;
  as?: "p" | "h1" | "h2" | "h3" | "span";
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "muted" | "danger" | "success";
  role?: "alert" | "status";
};

export function Text({ children, as: Tag = "p", size = "md", tone = "default", role }: Props) {
  return <Tag role={role} {...stylex.props(styles.base, styles[size], styles[tone])}>{children}</Tag>;
}
```

`src/ui/Button.tsx`:
```tsx
import * as stylex from "@stylexjs/stylex";
import type { ButtonHTMLAttributes } from "react";
import { color, font, radius, space } from "./tokens.stylex";

const styles = stylex.create({
  base: {
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: radius.md,
    paddingBlock: space.sm,
    paddingInline: space.md,
    fontFamily: font.body,
    fontSize: font.sizeMd,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    opacity: { default: 1, ":disabled": 0.6 },
  },
  primary: { backgroundColor: color.accent, borderColor: color.accent, color: color.accentText },
  secondary: { backgroundColor: color.surface, borderColor: color.border, color: color.text },
});

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style"> & { variant?: "primary" | "secondary" };

export function Button({ variant = "primary", type = "button", ...rest }: Props) {
  return <button type={type} {...rest} {...stylex.props(styles.base, styles[variant])} />;
}
```

`src/ui/Field.tsx`:
```tsx
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { color, font, space } from "./tokens.stylex";

const styles = stylex.create({
  wrap: { display: "flex", flexDirection: "column", gap: space.xs, borderWidth: 0, margin: 0, padding: 0 },
  label: { fontWeight: 600, fontSize: font.sizeSm, color: color.text },
  help: { fontSize: font.sizeSm, color: color.textMuted, margin: 0 },
  error: { fontSize: font.sizeSm, color: color.danger, margin: 0 },
});

type Props = { id: string; label: string; required?: boolean; help?: string; errors?: string[]; children: ReactNode };

export function Field({ id, label, required, help, errors, children }: Props) {
  return (
    <div {...stylex.props(styles.wrap)}>
      <label htmlFor={id} {...stylex.props(styles.label)}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {help ? <p id={`${id}-help`} {...stylex.props(styles.help)}>{help}</p> : null}
      {children}
      {errors?.map((message) => (
        <p key={message} role="alert" {...stylex.props(styles.error)}>{message}</p>
      ))}
    </div>
  );
}
```

`src/ui/inputs.tsx`:
```tsx
import * as stylex from "@stylexjs/stylex";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { color, font, radius, space } from "./tokens.stylex";

const styles = stylex.create({
  control: {
    fontFamily: font.body,
    fontSize: font.sizeMd,
    paddingBlock: space.sm,
    paddingInline: space.sm,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: radius.sm,
    backgroundColor: color.bg,
    color: color.text,
    maxWidth: "100%",
  },
  invalid: { borderColor: color.danger },
  textarea: { minHeight: "8rem", resize: "vertical" },
});

type Invalid = { invalid?: boolean };

export function Input({ invalid, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "style"> & Invalid) {
  const isBox = rest.type === "checkbox" || rest.type === "radio";
  return <input aria-invalid={invalid || undefined} {...rest} {...(isBox ? {} : stylex.props(styles.control, invalid && styles.invalid))} />;
}

export function Textarea({ invalid, ...rest }: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "style"> & Invalid) {
  return <textarea aria-invalid={invalid || undefined} {...rest} {...stylex.props(styles.control, styles.textarea, invalid && styles.invalid)} />;
}

export function Select({ invalid, ...rest }: Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "style"> & Invalid) {
  return <select aria-invalid={invalid || undefined} {...rest} {...stylex.props(styles.control, invalid && styles.invalid)} />;
}
```

`src/ui/Icon.tsx`:
```tsx
import Image from "next/image";

/** Renders a Lucide SVG from /public/icons. Decorative only. */
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <Image src={`/icons/${name}.svg`} alt="" aria-hidden width={size} height={size} unoptimized />;
}
```

- [ ] **Step 3: Profession listing query**

`src/features/professions/queries.ts`:
```ts
import "server-only";
import { localizedText, type LocalizedText } from "@/lib/i18n/localized";
import { createServerSupabase } from "@/lib/supabase/server";

export type ProfessionCard = { slug: string; name: LocalizedText; icon: string; openPositions: number };

/** Active professions visible to the public (RLS: is_active). */
export async function listActiveProfessions(): Promise<ProfessionCard[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("professions")
    .select("slug, name, icon, open_positions")
    .order("is_featured", { ascending: false })
    .order("sort_order");
  if (error) throw error;
  return data.map((row) => ({
    slug: row.slug,
    name: localizedText.parse(row.name),
    icon: row.icon,
    openPositions: row.open_positions,
  }));
}
```

- [ ] **Step 4: Pages**

`src/app/[locale]/page.tsx` (replace the whole file):
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { listActiveProfessions } from "@/features/professions/queries";
import { localized } from "@/lib/i18n/localized";
import { Icon } from "@/ui/Icon";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tMeta, professions] = await Promise.all([getTranslations("site"), getTranslations("metadata"), listActiveProfessions()]);

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{tMeta("title")}</Text>
      {professions.length === 0 ? <Text tone="muted">{t("noProfessions")}</Text> : null}
      <Stack as="ul" gap="sm">
        {professions.map((p) => (
          <li key={p.slug}>
            <Stack direction="row" gap="sm">
              <Icon name={p.icon} />
              <Text as="span" size="lg">{localized(p.name, locale)}</Text>
              <Text as="span" tone="muted">{t("openPositions", { count: p.openPositions })}</Text>
              <Link href={`/apply/${p.slug}`}>{t("apply")}</Link>
            </Stack>
          </li>
        ))}
      </Stack>
    </Stack>
  );
}
```

`src/app/[locale]/not-found.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Text } from "@/ui/Text";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return <Text as="h1" size="xl">{t("notFoundTitle")}</Text>;
}
```

`src/app/[locale]/error.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  console.error(error);
  return (
    <Stack>
      <Text as="h1" size="xl">{t("genericTitle")}</Text>
      <Button onClick={reset}>{t("retry")}</Button>
    </Stack>
  );
}
```

In `src/app/[locale]/layout.tsx`, give the main element page padding. Add these imports and styles:
```tsx
import * as stylex from "@stylexjs/stylex";
import { color, space } from "@/ui/tokens.stylex";

const styles = stylex.create({
  body: { backgroundColor: color.bg, color: color.text },
  main: { maxWidth: "960px", marginInline: "auto", padding: space.lg },
});
```
Then change `<body>` to `<body {...stylex.props(styles.body)}>` and `<main id="main">` to `<main id="main" {...stylex.props(styles.main)}>`.

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint && npm run build
npm run dev   # in another terminal
curl -s http://localhost:3000/en | grep -o "Nursing &amp; healthcare\|Apply" | sort -u
curl -s http://localhost:3000/de | grep -o "Pflege &amp; Gesundheit"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/admin
```
Expected:
- the build passes;
- `/en` lists "Nursing & healthcare" with an "Apply" link, and `/de` shows "Pflege & Gesundheit";
- `/en/admin` returns `307` (the redirect to login, whose page arrives in Task 10).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): StyleX tokens, primitives, profession list home page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 7: Form engine (definition schema, answer validation, file rules)

**Files:**
- Create: `src/features/forms/definition.ts`, `src/features/forms/definition.test.ts`, `src/features/forms/answers.ts`, `src/features/forms/answers.test.ts`, `src/features/forms/files.ts`, `src/features/forms/files.test.ts`

**Interfaces:**
- Consumes: `localizedText` (Task 2), `FieldErrors` (Task 2).
- Produces:
  - `FIELD_TYPES`, `LANGUAGE_LEVELS`, `formDefinition` (zod), `type FormDefinition`, `type FormField`.
  - `buildAnswerSchema(def: FormDefinition): z.ZodObject` (non-file fields only; strict).
  - `validateAnswers(def: FormDefinition, answers: unknown): { ok: true; data: Record<string, unknown> } | { ok: false; fieldErrors: FieldErrors }` (codes `required` | `invalid`).
  - `formDataToAnswers(def: FormDefinition, data: FormData): Record<string, unknown>` (input names are `answers.<key>`).
  - `type FileMeta = { fieldKey: string; name: string; type: string; size: number }`.
  - `DEFAULT_MAX_FILE_MB = 10`.
  - `validateFiles(def: FormDefinition, files: FileMeta[]): FieldErrors` (codes `required` | `too_many` | `too_large` | `type_not_allowed` | `unknown_field`).
  - `mimeMatches(pattern: string, mime: string): boolean`.
  - `buildStoragePath(applicationId: string, fieldKey: string, fileName: string, nonce: string): string`.

- [ ] **Step 1: Write failing tests**

`src/features/forms/definition.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formDefinition } from "./definition";

const label = { de: "Feld", en: "Field" };

describe("formDefinition", () => {
  it("accepts a valid definition and defaults required to false", () => {
    const def = formDefinition.parse({ fields: [{ key: "notes", type: "textarea", label }] });
    expect(def.fields[0].required).toBe(false);
  });

  it("rejects duplicate keys", () => {
    const r = formDefinition.safeParse({ fields: [{ key: "a", type: "text", label }, { key: "a", type: "text", label }] });
    expect(r.success).toBe(false);
  });

  it("rejects reserved keys used by the fixed fields", () => {
    expect(formDefinition.safeParse({ fields: [{ key: "email", type: "text", label }] }).success).toBe(false);
  });

  it("requires options for choice fields", () => {
    expect(formDefinition.safeParse({ fields: [{ key: "a", type: "select", label }] }).success).toBe(false);
  });

  it("rejects a field in an unknown section", () => {
    expect(formDefinition.safeParse({ fields: [{ key: "a", type: "text", label, section: "nope" }] }).success).toBe(false);
  });

  it("caps file size at the bucket limit", () => {
    expect(formDefinition.safeParse({ fields: [{ key: "cv", type: "file", label, maxSizeMb: 50 }] }).success).toBe(false);
  });
});
```

`src/features/forms/answers.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formDefinition } from "./definition";
import { formDataToAnswers, validateAnswers } from "./answers";

const label = { de: "x", en: "x" };
const def = formDefinition.parse({
  fields: [
    { key: "level", type: "language_level", required: true, label },
    { key: "years", type: "number", required: true, label },
    { key: "area", type: "select", required: true, label, options: [{ value: "icu", label }, { value: "gen", label }] },
    { key: "skills", type: "multiselect", label, options: [{ value: "a", label }, { value: "b", label }] },
    { key: "consent", type: "checkbox", required: true, label },
    { key: "started", type: "checkbox", label },
    { key: "note", type: "textarea", label },
    { key: "since", type: "date", label },
    { key: "cv", type: "file", required: true, label },
  ],
});

describe("formDataToAnswers", () => {
  it("coerces types, trims text and omits blanks and files", () => {
    const fd = new FormData();
    fd.set("answers.level", "B2");
    fd.set("answers.years", " 4 ");
    fd.set("answers.area", "icu");
    fd.append("answers.skills", "a");
    fd.append("answers.skills", "b");
    fd.set("answers.consent", "on");
    fd.set("answers.note", "   ");
    fd.set("answers.cv", new Blob(["x"]));
    expect(formDataToAnswers(def, fd)).toEqual({ level: "B2", years: 4, area: "icu", skills: ["a", "b"], consent: true, started: false });
  });
});

describe("validateAnswers", () => {
  const valid = { level: "B2", years: 4, area: "icu", consent: true };

  it("accepts valid answers and fills defaults", () => {
    const r = validateAnswers(def, valid);
    expect(r).toEqual({ ok: true, data: { ...valid, skills: [], started: false } });
  });

  it("reports missing required fields as required", () => {
    const r = validateAnswers(def, { consent: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors).toMatchObject({ level: ["required"], years: ["required"], area: ["required"] });
  });

  it("reports an unchecked required checkbox as required", () => {
    const r = validateAnswers(def, { ...valid, consent: false });
    expect(!r.ok && r.fieldErrors.consent).toEqual(["required"]);
  });

  it("reports bad values as invalid", () => {
    const r = validateAnswers(def, { ...valid, years: Number("abc"), area: "nope", since: "31.12.2020" });
    expect(!r.ok && r.fieldErrors).toMatchObject({ years: ["invalid"], area: ["invalid"], since: ["invalid"] });
  });

  it("rejects unknown keys", () => {
    const r = validateAnswers(def, { ...valid, hacker: "x" });
    expect(r.ok).toBe(false);
  });
});
```

`src/features/forms/files.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formDefinition } from "./definition";
import { buildStoragePath, mimeMatches, validateFiles } from "./files";

const label = { de: "x", en: "x" };
const def = formDefinition.parse({
  fields: [
    { key: "cv", type: "file", required: true, accept: ["application/pdf"], maxSizeMb: 1, label },
    { key: "photos", type: "file", accept: ["image/*"], label },
  ],
});
const MB = 1024 * 1024;

describe("validateFiles", () => {
  it("accepts a valid set", () => {
    expect(validateFiles(def, [{ fieldKey: "cv", name: "cv.pdf", type: "application/pdf", size: MB }])).toEqual({});
  });
  it("flags a missing required file", () => expect(validateFiles(def, [])).toEqual({ cv: ["required"] }));
  it("flags size, type, count and unknown fields", () => {
    const errors = validateFiles(def, [
      { fieldKey: "cv", name: "a.pdf", type: "application/pdf", size: MB + 1 },
      { fieldKey: "cv", name: "b.exe", type: "application/x-msdownload", size: 10 },
      { fieldKey: "evil", name: "x", type: "text/plain", size: 1 },
    ]);
    expect(errors.cv).toEqual(expect.arrayContaining(["too_many", "too_large", "type_not_allowed"]));
    expect(errors.evil).toEqual(["unknown_field"]);
  });
  it("flags empty files", () =>
    expect(validateFiles(def, [{ fieldKey: "cv", name: "a.pdf", type: "application/pdf", size: 0 }])).toEqual({ cv: ["too_large"] }));
});

describe("mimeMatches", () => {
  it("handles wildcards", () => {
    expect(mimeMatches("image/*", "image/png")).toBe(true);
    expect(mimeMatches("image/*", "application/pdf")).toBe(false);
    expect(mimeMatches("application/pdf", "application/pdf")).toBe(true);
  });
});

describe("buildStoragePath", () => {
  it("scopes to the application and sanitises the name", () => {
    expect(buildStoragePath("app-1", "cv", "Lebenslauf Müller (final).pdf", "n1")).toBe("app-1/cv/n1-Lebenslauf_Mu_ller_final_.pdf");
  });
  it("strips path traversal", () => {
    expect(buildStoragePath("app-1", "cv", "../../etc/passwd", "n1")).toBe("app-1/cv/n1-____etc_passwd");
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test -- src/features/forms`
Expected: FAIL, because the modules `./definition`, `./answers` and `./files` are not found.

- [ ] **Step 3: Implement the definition**

`src/features/forms/definition.ts`:
```ts
import { z } from "zod";
import { localizedText } from "@/lib/i18n/localized";

export const FIELD_TYPES = [
  "text", "textarea", "email", "tel", "select", "multiselect", "radio", "checkbox", "date", "number", "language_level", "file",
] as const;
export const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "native"] as const;
export const MAX_FILE_MB = 20; // matches the `applications` bucket limit

/** Keys used by the fixed applicant fields and the honeypot. */
const RESERVED_KEYS = ["full_name", "fullName", "email", "phone", "website"];
const CHOICE_TYPES = new Set(["select", "multiselect", "radio"]);

const option = z.object({ value: z.string().min(1).max(100), label: localizedText });

export const formField = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/).refine((k) => !RESERVED_KEYS.includes(k), "reserved key"),
    type: z.enum(FIELD_TYPES),
    label: localizedText,
    help: localizedText.optional(),
    required: z.boolean().default(false),
    options: z.array(option).optional(),
    accept: z.array(z.string().regex(/^[a-z]+\/([a-z0-9.+-]+|\*)$/)).optional(),
    maxSizeMb: z.number().positive().max(MAX_FILE_MB).optional(),
    section: z.string().optional(),
  })
  .superRefine((field, ctx) => {
    if (CHOICE_TYPES.has(field.type) && !field.options?.length) {
      ctx.addIssue({ code: "custom", message: "options required", path: ["options"] });
    }
  });

export const formDefinition = z
  .object({
    sections: z.array(z.object({ id: z.string().min(1), title: localizedText })).optional(),
    fields: z.array(formField),
  })
  .superRefine((def, ctx) => {
    const seen = new Set<string>();
    def.fields.forEach((field, i) => {
      if (seen.has(field.key)) ctx.addIssue({ code: "custom", message: `duplicate key ${field.key}`, path: ["fields", i, "key"] });
      seen.add(field.key);
      if (field.section && !def.sections?.some((s) => s.id === field.section)) {
        ctx.addIssue({ code: "custom", message: `unknown section ${field.section}`, path: ["fields", i, "section"] });
      }
    });
  });

export type FormDefinition = z.infer<typeof formDefinition>;
export type FormField = z.infer<typeof formField>;
```

- [ ] **Step 4: Implement answers**

`src/features/forms/answers.ts`:
```ts
import { z } from "zod";
import type { FieldErrors } from "@/lib/result";
import { LANGUAGE_LEVELS, type FormDefinition, type FormField } from "./definition";

function optionalUnless(required: boolean, schema: z.ZodType): z.ZodType {
  return required ? schema : schema.optional();
}

function fieldSchema(field: FormField): z.ZodType {
  const values = (field.options ?? []).map((o) => o.value) as [string, ...string[]];
  switch (field.type) {
    case "checkbox":
      return field.required ? z.literal(true) : z.boolean().default(false);
    case "multiselect":
      return field.required ? z.array(z.enum(values)).min(1) : z.array(z.enum(values)).default([]);
    case "select":
    case "radio":
      return optionalUnless(field.required, z.enum(values));
    case "language_level":
      return optionalUnless(field.required, z.enum(LANGUAGE_LEVELS));
    case "number":
      return optionalUnless(field.required, z.number());
    case "email":
      return optionalUnless(field.required, z.email());
    case "date":
      return optionalUnless(field.required, z.iso.date());
    case "textarea":
      return optionalUnless(field.required, z.string().trim().min(1).max(5000));
    default: // text, tel
      return optionalUnless(field.required, z.string().trim().min(1).max(500));
  }
}

/** Zod schema for the non-file answers of one form version. */
export function buildAnswerSchema(def: FormDefinition) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of def.fields) {
    if (field.type !== "file") shape[field.key] = fieldSchema(field);
  }
  return z.strictObject(shape);
}

export function validateAnswers(
  def: FormDefinition,
  answers: unknown,
): { ok: true; data: Record<string, unknown> } | { ok: false; fieldErrors: FieldErrors } {
  const result = buildAnswerSchema(def).safeParse(answers);
  if (result.success) return { ok: true, data: result.data };

  const input = (answers ?? {}) as Record<string, unknown>;
  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.code === "unrecognized_keys" ? issue.keys[0] : String(issue.path[0] ?? "_form");
    const field = def.fields.find((f) => f.key === key);
    const missing = input[key] === undefined || (field?.type === "checkbox" && input[key] === false) ||
      (field?.type === "multiselect" && Array.isArray(input[key]) && (input[key] as unknown[]).length === 0);
    fieldErrors[key] = [field?.required && missing ? "required" : "invalid"];
  }
  return { ok: false, fieldErrors };
}

/** Reads `answers.<key>` inputs from a submitted form. Blank values are omitted. */
export function formDataToAnswers(def: FormDefinition, data: FormData): Record<string, unknown> {
  const answers: Record<string, unknown> = {};
  for (const field of def.fields) {
    const name = `answers.${field.key}`;
    if (field.type === "file") continue;
    if (field.type === "checkbox") {
      answers[field.key] = data.get(name) === "on";
      continue;
    }
    if (field.type === "multiselect") {
      const values = data.getAll(name).map(String);
      if (values.length) answers[field.key] = values;
      continue;
    }
    const raw = data.get(name);
    const text = typeof raw === "string" ? raw.trim() : "";
    if (text === "") continue;
    answers[field.key] = field.type === "number" ? Number(text) : text;
  }
  return answers;
}
```

Note: in the multiselect test above, `skills` is present with `["a","b"]`. When no option is chosen the key is omitted, and the default fills `[]`.

- [ ] **Step 5: Implement files**

`src/features/forms/files.ts`:
```ts
import type { FieldErrors } from "@/lib/result";
import type { FormDefinition } from "./definition";

export type FileMeta = { fieldKey: string; name: string; type: string; size: number };
export const DEFAULT_MAX_FILE_MB = 10;

export function mimeMatches(pattern: string, mime: string): boolean {
  return pattern.endsWith("/*") ? mime.startsWith(pattern.slice(0, -1)) : pattern === mime;
}

export function validateFiles(def: FormDefinition, files: FileMeta[]): FieldErrors {
  const errors: FieldErrors = {};
  const add = (key: string, code: string) => {
    errors[key] = [...new Set([...(errors[key] ?? []), code])];
  };
  const fileFields = def.fields.filter((f) => f.type === "file");

  for (const file of files) {
    if (!fileFields.some((f) => f.key === file.fieldKey)) add(file.fieldKey, "unknown_field");
  }
  for (const field of fileFields) {
    const mine = files.filter((f) => f.fieldKey === field.key);
    if (field.required && mine.length === 0) add(field.key, "required");
    if (mine.length > 1) add(field.key, "too_many");
    const maxBytes = (field.maxSizeMb ?? DEFAULT_MAX_FILE_MB) * 1024 * 1024;
    for (const file of mine) {
      if (file.size <= 0 || file.size > maxBytes) add(field.key, "too_large");
      if (field.accept?.length && !field.accept.some((pattern) => mimeMatches(pattern, file.type))) add(field.key, "type_not_allowed");
    }
  }
  return errors;
}

/** `<applicationId>/<fieldKey>/<nonce>-<safe name>`. The prefix is what finalize checks ownership against. */
export function buildStoragePath(applicationId: string, fieldKey: string, fileName: string, nonce: string): string {
  const safe = fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/\.{2,}/g, "_")
    .slice(-80);
  return `${applicationId}/${fieldKey}/${nonce}-${safe}`;
}
```

How the expected paths are derived:
- `"../../etc/passwd"`: `[^\w.-]+` turns each `/` into `_` (`.._.._etc_passwd`), then `\.{2,}` turns each `..` into `_`, giving `____etc_passwd`.
- `"Lebenslauf Müller (final).pdf"`: NFKD splits `ü` into `u` + a combining mark, which becomes `_`. The ` (` run becomes one `_`, and `)` becomes `_`, giving `Lebenslauf_Mu_ller_final_.pdf`.

- [ ] **Step 6: Run to verify they pass**

Run: `npm test -- src/features/forms`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/forms
git commit -m "feat(forms): form definition schema, answer validation, file rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 8: Application submission (server)

**Files:**
- Create: `src/features/applications/submission.ts`, `src/features/applications/submission.test.ts`, `src/features/applications/queries.ts`, `src/features/applications/actions.ts`

**Interfaces:**
- Consumes: `formDefinition`, `validateAnswers`, `validateFiles`, `buildStoragePath`, `FileMeta` (Task 7); `createServiceSupabase`, `ServiceClient` (Task 5); `ok`, `fail`, `ActionResult` (Task 2).
- Produces:
  - `submissionInput` / `finalizeInput` (zod), with `type SubmissionInput` and `type FinalizeInput`.
  - `isSubmittableForm(form: { professionId: string; publishedAt: string | null }, professionId: string): boolean`.
  - `isOwnedPath(applicationId: string, path: string): boolean`.
  - `fileMetaFromStorage(path: string, meta: unknown): FileMeta | null`.
  - `getFormForSubmission(supabase: ServiceClient, slug: string, formId: string): Promise<{ id: string; professionId: string; definition: FormDefinition } | null>`.
  - `getFormById(supabase: ServiceClient, formId: string): Promise<FormDefinition | null>`.
  - Server actions:
    - `submitApplication(input: SubmissionInput): Promise<ActionResult<{ applicationId: string; uploads: { fieldKey: string; path: string; token: string }[] }>>`
    - `finalizeApplication(input: FinalizeInput): Promise<ActionResult<null>>`
  - Form error codes: `invalid`, `rate_limited`, `form_unavailable`, `upload_missing`, `server_error`.

- [ ] **Step 1: Write failing tests**

`src/features/applications/submission.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { fileMetaFromStorage, isOwnedPath, isSubmittableForm, submissionInput } from "./submission";

const id = "a0000000-0000-4000-8000-000000000001";

describe("isSubmittableForm", () => {
  it("accepts any published version of the same profession", () =>
    expect(isSubmittableForm({ professionId: "p1", publishedAt: "2026-01-01T00:00:00Z" }, "p1")).toBe(true));
  it("rejects a form belonging to another profession", () =>
    expect(isSubmittableForm({ professionId: "p2", publishedAt: "2026-01-01T00:00:00Z" }, "p1")).toBe(false));
  it("rejects an unpublished draft", () => expect(isSubmittableForm({ professionId: "p1", publishedAt: null }, "p1")).toBe(false));
});

describe("isOwnedPath", () => {
  it("accepts paths under the application prefix", () => expect(isOwnedPath(id, `${id}/cv/n-cv.pdf`)).toBe(true));
  it("rejects other applications' paths", () =>
    expect(isOwnedPath(id, "b0000000-0000-4000-8000-000000000001/cv/n-cv.pdf")).toBe(false));
  it("rejects traversal", () => expect(isOwnedPath(id, `${id}/../other/cv.pdf`)).toBe(false));
  it("rejects paths without a field segment", () => expect(isOwnedPath(id, `${id}/cv.pdf`)).toBe(false));
});

describe("fileMetaFromStorage", () => {
  it("uses real size and MIME from storage", () =>
    expect(fileMetaFromStorage(`${id}/cv/n-cv.pdf`, { size: 1234, mimetype: "application/pdf" })).toEqual({
      fieldKey: "cv", name: "n-cv.pdf", type: "application/pdf", size: 1234,
    }));
  it("returns null when the object is missing or malformed", () => {
    expect(fileMetaFromStorage(`${id}/cv/x`, null)).toBeNull();
    expect(fileMetaFromStorage(`${id}/cv/x`, { size: "big" })).toBeNull();
  });
});

describe("submissionInput", () => {
  const base = {
    professionSlug: "pflege", formId: id, locale: "en", fullName: "  Ada Lovelace ", email: "ada@example.com",
    phone: "", website: "", answers: {}, files: [],
  };
  it("trims and normalises optional phone", () => {
    const parsed = submissionInput.parse(base);
    expect(parsed.fullName).toBe("Ada Lovelace");
    expect(parsed.phone).toBeUndefined();
  });
  it("rejects a bad email", () => expect(submissionInput.safeParse({ ...base, email: "nope" }).success).toBe(false));
  it("caps the number of files", () =>
    expect(submissionInput.safeParse({ ...base, files: Array.from({ length: 11 }, () => ({ fieldKey: "cv", name: "a", type: "x", size: 1 })) }).success).toBe(false));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/features/applications`
Expected: FAIL, because `./submission` is not found.

- [ ] **Step 3: Implement the pure helpers**

`src/features/applications/submission.ts`:
```ts
import { z } from "zod";
import { locales } from "@/i18n/config";
import type { FileMeta } from "@/features/forms/files";

export const submissionInput = z.object({
  professionSlug: z.string().min(1).max(100),
  formId: z.guid(),
  locale: z.enum(locales),
  fullName: z.string().trim().min(2).max(200),
  email: z.email().max(320),
  phone: z.string().trim().max(50).optional().transform((v) => v || undefined),
  website: z.string().optional(), // honeypot: real users never fill it
  answers: z.record(z.string(), z.unknown()),
  files: z
    .array(z.object({ fieldKey: z.string().max(40), name: z.string().min(1).max(255), type: z.string().max(255), size: z.number().int() }))
    .max(10),
});
export type SubmissionInput = z.input<typeof submissionInput>;

export const finalizeInput = z.object({ applicationId: z.guid(), paths: z.array(z.string().max(500)).max(10) });
export type FinalizeInput = z.input<typeof finalizeInput>;

/** A form is submittable if it is a published version of the profession being applied to. */
export function isSubmittableForm(form: { professionId: string; publishedAt: string | null }, professionId: string): boolean {
  return form.professionId === professionId && form.publishedAt !== null;
}

/** Matches `<applicationId>/<fieldKey>/<file>` with no traversal. */
export function isOwnedPath(applicationId: string, path: string): boolean {
  const parts = path.split("/");
  return parts.length === 3 && parts[0] === applicationId && parts.every((p) => p !== "" && p !== "." && p !== "..");
}

const storageMeta = z.object({ size: z.number().int(), mimetype: z.string() });

/** Builds FileMeta from what Storage actually holds (never trust client-reported size/MIME). */
export function fileMetaFromStorage(path: string, meta: unknown): FileMeta | null {
  const parsed = storageMeta.safeParse(meta);
  if (!parsed.success) return null;
  const [, fieldKey, name] = path.split("/");
  return { fieldKey, name, type: parsed.data.mimetype, size: parsed.data.size };
}
```

Run: `npm test -- src/features/applications`
Expected: PASS.

- [ ] **Step 4: Server-side form lookup**

`src/features/applications/queries.ts`:
```ts
import "server-only";
import { formDefinition, type FormDefinition } from "@/features/forms/definition";
import type { ServiceClient } from "@/lib/supabase/service";
import { isSubmittableForm } from "./submission";

function parseDefinition(schema: unknown, formId: string): FormDefinition | null {
  const parsed = formDefinition.safeParse(schema);
  if (!parsed.success) {
    console.error(`profession_forms ${formId} has an invalid schema`, parsed.error.issues);
    return null;
  }
  return parsed.data;
}

/** The form an applicant submitted against, if it is still acceptable. */
export async function getFormForSubmission(supabase: ServiceClient, slug: string, formId: string) {
  const { data: profession } = await supabase
    .from("professions")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!profession) return null;

  const { data: form } = await supabase
    .from("profession_forms")
    .select("id, profession_id, published_at, schema")
    .eq("id", formId)
    .maybeSingle();
  if (!form || !isSubmittableForm({ professionId: form.profession_id, publishedAt: form.published_at }, profession.id)) return null;

  const definition = parseDefinition(form.schema, form.id);
  return definition ? { id: form.id, professionId: profession.id, definition } : null;
}

export async function getFormById(supabase: ServiceClient, formId: string): Promise<FormDefinition | null> {
  const { data } = await supabase.from("profession_forms").select("schema").eq("id", formId).maybeSingle();
  return data ? parseDefinition(data.schema, formId) : null;
}
```

- [ ] **Step 5: Server actions**

`src/features/applications/actions.ts`:
```ts
"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { validateAnswers } from "@/features/forms/answers";
import { buildStoragePath, validateFiles, type FileMeta } from "@/features/forms/files";
import { fail, ok, type ActionResult } from "@/lib/result";
import type { Json } from "@/lib/supabase/database.types";
import { createServiceSupabase } from "@/lib/supabase/service";
import { getFormById, getFormForSubmission } from "./queries";
import { fileMetaFromStorage, finalizeInput, isOwnedPath, submissionInput, type FinalizeInput, type SubmissionInput } from "./submission";

const BUCKET = "applications";
const RATE_LIMIT = { max: 5, windowSeconds: 3600 };
const HONEYPOT_ID = "00000000-0000-0000-0000-000000000000";

type Upload = { fieldKey: string; path: string; token: string };

export async function submitApplication(raw: SubmissionInput): Promise<ActionResult<{ applicationId: string; uploads: Upload[] }>> {
  const parsed = submissionInput.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = ["invalid"];
    return fail("invalid", fieldErrors);
  }
  const input = parsed.data;
  // Bots fill the hidden field. Pretend success so they learn nothing.
  if (input.website) return ok({ applicationId: HONEYPOT_ID, uploads: [] });

  const supabase = createServiceSupabase();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { data: allowed, error: rateError } = await supabase.rpc("hit_rate_limit", {
    p_bucket: "apply", p_key: ip, p_max: RATE_LIMIT.max, p_window_seconds: RATE_LIMIT.windowSeconds,
  });
  if (rateError) {
    console.error("hit_rate_limit failed", rateError);
    return fail("server_error");
  }
  if (!allowed) return fail("rate_limited");

  const form = await getFormForSubmission(supabase, input.professionSlug, input.formId);
  if (!form) return fail("form_unavailable");

  const answers = validateAnswers(form.definition, input.answers);
  const fileErrors = validateFiles(form.definition, input.files);
  if (!answers.ok || Object.keys(fileErrors).length > 0) {
    return fail("invalid", { ...(answers.ok ? {} : answers.fieldErrors), ...fileErrors });
  }

  const { data: application, error } = await supabase
    .from("applications")
    .insert({
      profession_id: form.professionId,
      form_id: form.id,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      locale: input.locale,
      answers: answers.data as Json,
    })
    .select("id")
    .single();
  if (error) {
    console.error("insert application failed", error);
    return fail("server_error");
  }

  const uploads: Upload[] = [];
  for (const file of input.files) {
    const path = buildStoragePath(application.id, file.fieldKey, file.name, randomUUID());
    const { data, error: urlError } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (urlError) {
      console.error("createSignedUploadUrl failed", urlError);
      return fail("server_error");
    }
    uploads.push({ fieldKey: file.fieldKey, path: data.path, token: data.token });
  }
  return ok({ applicationId: application.id, uploads });
}

export async function finalizeApplication(raw: FinalizeInput): Promise<ActionResult<null>> {
  const parsed = finalizeInput.safeParse(raw);
  if (!parsed.success) return fail("invalid");
  const { applicationId, paths } = parsed.data;
  if (applicationId === HONEYPOT_ID) return ok(null);
  if (!paths.every((path) => isOwnedPath(applicationId, path))) return fail("invalid");

  const supabase = createServiceSupabase();
  const { data: application } = await supabase
    .from("applications")
    .select("id, form_id, submitted_at")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application) return fail("invalid");
  if (application.submitted_at) return ok(null); // already finalized (double click / retry)

  const definition = await getFormById(supabase, application.form_id);
  if (!definition) return fail("server_error");

  const files: (FileMeta & { path: string })[] = [];
  for (const path of paths) {
    const { data: meta, error } = await supabase.rpc("storage_object_meta", { p_bucket: BUCKET, p_path: path });
    if (error) {
      console.error("storage_object_meta failed", error);
      return fail("server_error");
    }
    const file = fileMetaFromStorage(path, meta);
    if (!file) return fail("upload_missing");
    files.push({ ...file, path });
  }

  const fileErrors = validateFiles(definition, files);
  if (Object.keys(fileErrors).length > 0) return fail("invalid", fileErrors);

  if (files.length > 0) {
    const { error } = await supabase.from("application_files").upsert(
      files.map((f) => ({ application_id: applicationId, field_key: f.fieldKey, storage_path: f.path, mime: f.type, size: f.size })),
      { onConflict: "storage_path", ignoreDuplicates: true },
    );
    if (error) {
      console.error("insert application_files failed", error);
      return fail("server_error");
    }
  }

  const { error } = await supabase
    .from("applications")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", applicationId)
    .is("submitted_at", null);
  if (error) {
    console.error("finalize application failed", error);
    return fail("server_error");
  }
  return ok(null);
}
```

- [ ] **Step 6: Verify**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all unit tests pass, tsc is clean and lint is clean. (The actions are exercised end-to-end in Task 12.)

- [ ] **Step 7: Commit**

```bash
git add src/features/applications
git commit -m "feat(applications): validated submission and finalize actions with signed uploads

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: Public apply page + client form

**Files:**
- Create: `src/features/forms/collect-files.ts`, `src/features/forms/collect-files.test.ts`, `src/features/forms/DynamicFields.tsx`, `src/features/applications/ApplyForm.tsx`, `src/app/[locale]/apply/[slug]/page.tsx`
- Modify: `src/features/professions/queries.ts` (add `getApplyForm`)

**Interfaces:**
- Consumes: `formDataToAnswers` (Task 7), `submitApplication`, `finalizeApplication` (Task 8), `createBrowserSupabase` (Task 5), UI primitives (Task 6), `localized` (Task 2).
- Produces:
  - `collectFiles(def: FormDefinition, data: FormData): { fieldKey: string; file: File }[]`.
  - `getApplyForm(slug: string): Promise<{ slug: string; name: LocalizedText; formId: string; definition: FormDefinition } | null>`.
  - `<DynamicFields definition locale errors errorText />`, where `errorText: (code: string) => string`.
  - `<ApplyForm professionSlug formId definition locale />`.
  - DOM contract for e2e: `#field-fullName`, `#field-email`, `#field-<key>` (labelled by the translated label), a submit button with the text `apply.submit`, and `role="status"` success text `apply.success`.

- [ ] **Step 1: Write the failing test**

`src/features/forms/collect-files.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { collectFiles } from "./collect-files";
import { formDefinition } from "./definition";

const label = { de: "x", en: "x" };
const def = formDefinition.parse({ fields: [{ key: "cv", type: "file", label }, { key: "note", type: "text", label }] });

describe("collectFiles", () => {
  it("returns chosen files and skips empty inputs", () => {
    const fd = new FormData();
    fd.append("files.cv", new File(["%PDF"], "cv.pdf", { type: "application/pdf" }));
    fd.append("files.cv", new File([], "", { type: "application/octet-stream" }));
    const files = collectFiles(def, fd);
    expect(files.map((f) => [f.fieldKey, f.file.name])).toEqual([["cv", "cv.pdf"]]);
  });
});
```
Run `npm test -- collect-files`. Expected: FAIL, because the module is not found.

- [ ] **Step 2: Implement collectFiles**

`src/features/forms/collect-files.ts`:
```ts
import type { FormDefinition } from "./definition";

/** Files chosen in `files.<key>` inputs. An empty file input submits a nameless 0-byte File, which is skipped. */
export function collectFiles(def: FormDefinition, data: FormData): { fieldKey: string; file: File }[] {
  return def.fields
    .filter((field) => field.type === "file")
    .flatMap((field) =>
      data
        .getAll(`files.${field.key}`)
        .filter((value): value is File => value instanceof File && value.size > 0 && value.name !== "")
        .map((file) => ({ fieldKey: field.key, file })),
    );
}
```
Run `npm test -- collect-files`. Expected: PASS.

- [ ] **Step 3: Apply form query**

Append to `src/features/professions/queries.ts`:
```ts
import { formDefinition, type FormDefinition } from "@/features/forms/definition";

export type ApplyFormData = { slug: string; name: LocalizedText; formId: string; definition: FormDefinition };

/** Active profession plus its current published form (RLS hides everything else from anon). */
export async function getApplyForm(slug: string): Promise<ApplyFormData | null> {
  const supabase = await createServerSupabase();
  const { data: profession } = await supabase
    .from("professions")
    .select("slug, name, current_form_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!profession?.current_form_id) return null;

  const { data: form } = await supabase
    .from("profession_forms")
    .select("id, schema")
    .eq("id", profession.current_form_id)
    .maybeSingle();
  if (!form) return null;

  const definition = formDefinition.safeParse(form.schema);
  if (!definition.success) {
    console.error(`profession_forms ${form.id} has an invalid schema`, definition.error.issues);
    return null;
  }
  return { slug: profession.slug, name: localizedText.parse(profession.name), formId: form.id, definition: definition.data };
}
```
(Move the new `import` line up to the file's import block.)

- [ ] **Step 4: Field renderer**

`src/features/forms/DynamicFields.tsx`:
```tsx
import * as stylex from "@stylexjs/stylex";
import type { Locale } from "@/i18n/config";
import { localized } from "@/lib/i18n/localized";
import type { FieldErrors } from "@/lib/result";
import { Field } from "@/ui/Field";
import { Input, Select, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { color, font, space } from "@/ui/tokens.stylex";
import { LANGUAGE_LEVELS, type FormDefinition, type FormField } from "./definition";

const styles = stylex.create({
  group: { borderWidth: 0, margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.xs },
  legend: { fontWeight: 600, fontSize: font.sizeSm, padding: 0 },
  error: { color: color.danger, fontSize: font.sizeSm, margin: 0 },
});

const INPUT_TYPES: Partial<Record<FormField["type"], string>> = { text: "text", email: "email", tel: "tel", date: "date", number: "number" };

type Props = {
  definition: FormDefinition;
  locale: Locale;
  errors: FieldErrors;
  errorText: (code: string) => string;
  chooseLabel: string;
};

export function DynamicFields({ definition, locale, errors, errorText, chooseLabel }: Props) {
  return (
    <Stack gap="md">
      {definition.fields.map((field) => (
        <DynamicField key={field.key} field={field} locale={locale} errors={errors[field.key]?.map(errorText)} chooseLabel={chooseLabel} />
      ))}
    </Stack>
  );
}

function DynamicField({ field, locale, errors, chooseLabel }: { field: FormField; locale: Locale; errors?: string[]; chooseLabel: string }) {
  const id = `field-${field.key}`;
  const name = `answers.${field.key}`;
  const label = localized(field.label, locale);
  const help = field.help ? localized(field.help, locale) : undefined;
  const invalid = Boolean(errors?.length);
  const describedBy = help ? `${id}-help` : undefined;

  if (field.type === "radio" || field.type === "multiselect") {
    return (
      <fieldset {...stylex.props(styles.group)} aria-invalid={invalid || undefined}>
        <legend {...stylex.props(styles.legend)}>
          {label}
          {field.required ? <span aria-hidden="true"> *</span> : null}
        </legend>
        {field.options?.map((option) => (
          <label key={option.value}>
            <Input
              type={field.type === "radio" ? "radio" : "checkbox"}
              name={name}
              value={option.value}
              required={field.type === "radio" && field.required}
            />{" "}
            {localized(option.label, locale)}
          </label>
        ))}
        {errors?.map((message) => <p key={message} role="alert" {...stylex.props(styles.error)}>{message}</p>)}
      </fieldset>
    );
  }

  return (
    <Field id={id} label={label} required={field.required} help={help} errors={errors}>
      {field.type === "textarea" ? (
        <Textarea id={id} name={name} required={field.required} invalid={invalid} aria-describedby={describedBy} />
      ) : field.type === "select" || field.type === "language_level" ? (
        <Select id={id} name={name} required={field.required} invalid={invalid} aria-describedby={describedBy} defaultValue="">
          <option value="" disabled={field.required}>{chooseLabel}</option>
          {field.type === "language_level"
            ? LANGUAGE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)
            : field.options?.map((o) => <option key={o.value} value={o.value}>{localized(o.label, locale)}</option>)}
        </Select>
      ) : field.type === "checkbox" ? (
        <Input id={id} type="checkbox" name={name} required={field.required} invalid={invalid} aria-describedby={describedBy} />
      ) : field.type === "file" ? (
        <Input
          id={id}
          type="file"
          name={`files.${field.key}`}
          accept={field.accept?.join(",")}
          required={field.required}
          invalid={invalid}
          aria-describedby={describedBy}
        />
      ) : (
        <Input
          id={id}
          type={INPUT_TYPES[field.type] ?? "text"}
          name={name}
          required={field.required}
          invalid={invalid}
          aria-describedby={describedBy}
          step={field.type === "number" ? "any" : undefined}
        />
      )}
    </Field>
  );
}
```

- [ ] **Step 5: Client form**

`src/features/applications/ApplyForm.tsx`:
```tsx
"use client";

import * as stylex from "@stylexjs/stylex";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { collectFiles } from "@/features/forms/collect-files";
import { formDataToAnswers } from "@/features/forms/answers";
import type { FormDefinition } from "@/features/forms/definition";
import { DynamicFields } from "@/features/forms/DynamicFields";
import type { FieldErrors } from "@/lib/result";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { finalizeApplication, submitApplication } from "./actions";

const styles = stylex.create({
  honeypot: { position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" },
});

type Props = { professionSlug: string; formId: string; definition: FormDefinition; locale: Locale };
type Phase = "idle" | "sending" | "uploading" | "done";

export function ApplyForm({ professionSlug, formId, definition, locale }: Props) {
  const t = useTranslations("apply");
  const [phase, setPhase] = useState<Phase>("idle");
  const [formError, setFormError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const errorText = (code: string) => (t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.invalid"));
  const failWith = (code?: string, errors: FieldErrors = {}) => {
    setPhase("idle");
    setFormError(code);
    setFieldErrors(errors);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const files = collectFiles(definition, data);
    setPhase("sending");
    setFormError(undefined);
    setFieldErrors({});

    const submitted = await submitApplication({
      professionSlug,
      formId,
      locale,
      fullName: String(data.get("fullName") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      website: String(data.get("website") ?? ""),
      answers: formDataToAnswers(definition, data),
      files: files.map(({ fieldKey, file }) => ({ fieldKey, name: file.name, type: file.type, size: file.size })),
    });
    if (!submitted.ok) return failWith(submitted.formError, submitted.fieldErrors);

    setPhase("uploading");
    const supabase = createBrowserSupabase();
    // uploads[i] corresponds to files[i] (the server preserves order).
    for (const [i, upload] of submitted.data.uploads.entries()) {
      const { error } = await supabase.storage
        .from("applications")
        .uploadToSignedUrl(upload.path, upload.token, files[i].file, { contentType: files[i].file.type });
      if (error) return failWith("upload_failed");
    }

    const finalized = await finalizeApplication({
      applicationId: submitted.data.applicationId,
      paths: submitted.data.uploads.map((u) => u.path),
    });
    if (!finalized.ok) return failWith(finalized.formError, finalized.fieldErrors);
    setPhase("done");
  }

  if (phase === "done") return <Text role="status" tone="success">{t("success")}</Text>;

  const busy = phase !== "idle";
  const coreErrors = (key: string) => fieldErrors[key]?.map(errorText);

  return (
    <form onSubmit={handleSubmit} noValidate={false}>
      <Stack gap="md">
        <Text tone="muted" size="sm">{t("requiredHint")}</Text>
        <Field id="field-fullName" label={t("fullName")} required errors={coreErrors("fullName")}>
          <Input id="field-fullName" name="fullName" autoComplete="name" required minLength={2} invalid={Boolean(fieldErrors.fullName)} />
        </Field>
        <Field id="field-email" label={t("email")} required errors={coreErrors("email")}>
          <Input id="field-email" name="email" type="email" autoComplete="email" required invalid={Boolean(fieldErrors.email)} />
        </Field>
        <Field id="field-phone" label={t("phone")} errors={coreErrors("phone")}>
          <Input id="field-phone" name="phone" type="tel" autoComplete="tel" invalid={Boolean(fieldErrors.phone)} />
        </Field>
        <div aria-hidden="true" {...stylex.props(styles.honeypot)}>
          <input name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <DynamicFields definition={definition} locale={locale} errors={fieldErrors} errorText={errorText} chooseLabel={t("choose")} />
        {formError ? <Text role="alert" tone="danger">{errorText(formError)}</Text> : null}
        <Button type="submit" disabled={busy}>
          {phase === "sending" ? t("sending") : phase === "uploading" ? t("uploading") : t("submit")}
        </Button>
      </Stack>
    </form>
  );
}
```

- [ ] **Step 6: Page**

`src/app/[locale]/apply/[slug]/page.tsx`:
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { ApplyForm } from "@/features/applications/ApplyForm";
import { getApplyForm } from "@/features/professions/queries";
import { localized } from "@/lib/i18n/localized";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function ApplyPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const form = await getApplyForm(slug);
  if (!form) notFound();
  const t = await getTranslations("apply");

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("title", { profession: localized(form.name, locale) })}</Text>
      <ApplyForm professionSlug={form.slug} formId={form.formId} definition={form.definition} locale={locale} />
    </Stack>
  );
}
```

- [ ] **Step 7: Manual check**

```bash
npm run typecheck && npm run lint && npm test
npm run dev
```
In a browser, go to `http://localhost:3000/en/apply/pflege`. Fill in every required field, pick a small PDF for "CV (PDF)" and submit.
Expected: the button shows "Sending…", then "Uploading documents…", then the success message appears.

Then:
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "select full_name, submitted_at is not null as done, (select count(*) from application_files f where f.application_id = a.id) as files from applications a order by created_at desc limit 1;"
```
Expected: your name, `done = t`, `files = 1`.

Also check:
- `http://localhost:3000/en/apply/does-not-exist` returns 404.
- `/de/apply/pflege` shows German labels.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(apply): public application page with dynamic fields and signed uploads

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 10: Admin sign-in, session guard, protected layout

**Files:**
- Create: `src/features/admin-auth/session.ts`, `src/features/admin-auth/actions.ts`, `src/features/admin-auth/LoginForm.tsx`, `src/app/[locale]/admin/login/page.tsx`, `src/app/[locale]/admin/(protected)/layout.tsx`, `src/app/[locale]/admin/(protected)/page.tsx`

**Interfaces:**
- Consumes: `createServerSupabase` (Task 5), `isProtectedAdminPath` (Task 5, via proxy), `fail`/`ActionResult` (Task 2), UI primitives (Task 6).
- Produces:
  - `type AdminSession = { userId: string; role: "owner" | "editor"; displayName: string }`.
  - `getAdminSession(): Promise<AdminSession | null>` (per-request cached).
  - `requireAdmin(locale: Locale): Promise<AdminSession>` (redirects to `/<locale>/admin/login` when signed out or not an admin).
  - Server actions: `signIn(prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>>` and `signOut(formData: FormData): Promise<void>`.
  - Login error codes: `invalid_credentials`, `not_admin`.
  - DOM contract for e2e: `#admin-email`, `#admin-password`, and a submit button with the text `admin.signIn`.

- [ ] **Step 1: Session guard**

`src/features/admin-auth/session.ts`:
```ts
import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { createServerSupabase } from "@/lib/supabase/server";

export type AdminSession = { userId: string; role: "owner" | "editor"; displayName: string };

/** The signed-in admin, or null. getUser() re-validates the JWT with Supabase Auth on every request. */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: admin } = await supabase
    .from("admins")
    .select("role, display_name")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  return admin ? { userId: auth.user.id, role: admin.role, displayName: admin.display_name } : null;
});

export async function requireAdmin(locale: Locale): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  return session;
}
```

- [ ] **Step 2: Sign-in / sign-out actions**

`src/features/admin-auth/actions.ts`:
```ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { fail, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
  locale: z.enum(locales),
});

export async function signIn(_prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>> {
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("invalid_credentials");
  const { email, password, locale } = parsed.data;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return fail("invalid_credentials");

  const { data: admin } = await supabase.from("admins").select("id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return fail("not_admin");
  }
  redirect(`/${locale}/admin/applications`);
}

export async function signOut(formData: FormData): Promise<void> {
  const locale = z.enum(locales).catch("en").parse(formData.get("locale"));
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect(`/${locale}/admin/login`);
}
```

- [ ] **Step 3: Login form + page**

`src/features/admin-auth/LoginForm.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { signIn } from "./actions";

export function LoginForm({ locale }: { locale: Locale }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(signIn, null);
  const error = state && !state.ok ? state.formError : undefined;

  return (
    <form action={action}>
      <Stack gap="md">
        <input type="hidden" name="locale" value={locale} />
        <Field id="admin-email" label={t("email")} required>
          <Input id="admin-email" name="email" type="email" autoComplete="username" required />
        </Field>
        <Field id="admin-password" label={t("password")} required>
          <Input id="admin-password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        {error ? <Text role="alert" tone="danger">{t.has(`errors.${error}`) ? t(`errors.${error}`) : t("errors.server_error")}</Text> : null}
        <Button type="submit" disabled={pending}>{t("signIn")}</Button>
      </Stack>
    </form>
  );
}
```

`src/app/[locale]/admin/login/page.tsx`:
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { LoginForm } from "@/features/admin-auth/LoginForm";
import { getAdminSession } from "@/features/admin-auth/session";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function AdminLoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getAdminSession()) redirect(`/${locale}/admin/applications`);
  const t = await getTranslations("admin");
  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("signInTitle")}</Text>
      <LoginForm locale={locale} />
    </Stack>
  );
}
```

- [ ] **Step 4: Protected layout + index redirect**

`src/app/[locale]/admin/(protected)/layout.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/features/admin-auth/actions";
import { requireAdmin } from "@/features/admin-auth/session";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const admin = await requireAdmin(locale);
  const t = await getTranslations("admin");

  return (
    <Stack gap="lg">
      <Stack as="header" direction="row" gap="md">
        <Stack as="nav" direction="row" gap="md">
          <Link href="/admin/applications">{t("applications")}</Link>
        </Stack>
        <Text as="span" tone="muted" size="sm">{admin.displayName}</Text>
        <form action={signOut}>
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" variant="secondary">{t("signOut")}</Button>
        </form>
      </Stack>
      {children}
    </Stack>
  );
}
```

`src/app/[locale]/admin/(protected)/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";

export default async function AdminIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  redirect(`/${locale}/admin/applications`);
}
```

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint && npm test
npm run dev
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/en/admin/applications
```
Expected: `307 http://localhost:3000/en/admin/login`. That is the proxy's optimistic redirect; the page itself arrives in Task 11.

Manual checks in the browser at `/en/admin/login`:
1. A wrong password shows "Email or password is incorrect."
2. A user with no `admins` row shows "This account has no admin access." Create one with:
   ```bash
   node --env-file=.env.local -e "const {createClient}=require('@supabase/supabase-js');createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY).auth.admin.createUser({email:'nobody@iprince.local',password:'x-password',email_confirm:true}).then(r=>console.log(r.error??'ok'))"
   ```
3. `owner@iprince.local` / `local-dev-password` redirects to `/en/admin/applications` (404 until Task 11), and the header shows "Local Owner" plus a Sign out button.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(admin): Supabase email/password sign-in with admins-table guard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 11: Admin applications inbox

**Files:**
- Create: `src/features/applications/review.ts`, `src/features/applications/review.test.ts`, `src/features/applications/admin-queries.ts`, `src/features/applications/admin-actions.ts`, `src/features/applications/ReviewForm.tsx`, `src/app/[locale]/admin/(protected)/applications/page.tsx`, `src/app/[locale]/admin/(protected)/applications/[id]/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (Task 10), `formDefinition` (Task 7), `createServerSupabase` (Task 5), `localized` (Task 2), UI primitives (Task 6).
- Produces:
  - `APPLICATION_STATUSES` (a tuple matching the DB enum) and `type ApplicationStatus`.
  - `describeAnswers(def: FormDefinition, answers: Record<string, unknown>, locale: Locale, yesNo: { yes: string; no: string }): { key: string; label: string; value: string }[]`.
  - `listApplications(status?: ApplicationStatus): Promise<ApplicationRow[]>`, where `type ApplicationRow = { id; fullName; email; status; submittedAt: string; professionName: LocalizedText }`.
  - `getApplicationDetail(id: string): Promise<ApplicationDetail | null>` (answers described in the stored form version's labels, plus files with 10-minute signed URLs).
  - Server action `updateApplication(prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>>`.

- [ ] **Step 1: Write the failing test**

`src/features/applications/review.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formDefinition } from "@/features/forms/definition";
import { APPLICATION_STATUSES, describeAnswers } from "./review";

const def = formDefinition.parse({
  fields: [
    { key: "area", type: "select", label: { de: "Bereich", en: "Area" }, options: [{ value: "icu", label: { de: "Intensiv", en: "Intensive care" } }] },
    { key: "skills", type: "multiselect", label: { de: "Kenntnisse", en: "" }, options: [{ value: "a", label: { de: "A-de", en: "A" } }, { value: "b", label: { de: "B-de", en: "B" } }] },
    { key: "started", type: "checkbox", label: { de: "Begonnen", en: "Started" } },
    { key: "years", type: "number", label: { de: "Jahre", en: "Years" } },
    { key: "note", type: "textarea", label: { de: "Notiz", en: "Note" } },
    { key: "cv", type: "file", label: { de: "CV", en: "CV" } },
  ],
});

describe("describeAnswers", () => {
  it("uses labels from the form version, falls back to German, skips files and blanks", () => {
    const rows = describeAnswers(def, { area: "icu", skills: ["a", "b"], started: true, years: 4 }, "en", { yes: "Yes", no: "No" });
    expect(rows).toEqual([
      { key: "area", label: "Area", value: "Intensive care" },
      { key: "skills", label: "Kenntnisse", value: "A, B" },
      { key: "started", label: "Started", value: "Yes" },
      { key: "years", label: "Years", value: "4" },
    ]);
  });

  it("shows raw values for options that no longer exist", () => {
    expect(describeAnswers(def, { area: "gone" }, "en", { yes: "Yes", no: "No" })[0].value).toBe("gone");
  });
});

it("statuses match the DB enum", () => {
  expect(APPLICATION_STATUSES).toEqual(["new", "reviewing", "contacted", "placed", "rejected", "archived"]);
});
```
Run `npm test -- review`. Expected: FAIL, because the module is not found.

- [ ] **Step 2: Implement review helpers**

`src/features/applications/review.ts`:
```ts
import type { Locale } from "@/i18n/config";
import type { FormDefinition } from "@/features/forms/definition";
import { localized } from "@/lib/i18n/localized";

export const APPLICATION_STATUSES = ["new", "reviewing", "contacted", "placed", "rejected", "archived"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Human-readable answers using the exact form version the applicant saw. */
export function describeAnswers(
  def: FormDefinition,
  answers: Record<string, unknown>,
  locale: Locale,
  yesNo: { yes: string; no: string },
): { key: string; label: string; value: string }[] {
  return def.fields.flatMap((field) => {
    if (field.type === "file") return [];
    const raw = answers[field.key];
    if (raw === undefined || raw === null || raw === "" || (Array.isArray(raw) && raw.length === 0)) return [];
    const optionLabel = (value: unknown) => {
      const option = field.options?.find((o) => o.value === value);
      return option ? localized(option.label, locale) : String(value);
    };
    let value: string;
    if (field.type === "checkbox") value = raw === true ? yesNo.yes : yesNo.no;
    else if (Array.isArray(raw)) value = raw.map(optionLabel).join(", ");
    else if (field.type === "select" || field.type === "radio") value = optionLabel(raw);
    else value = String(raw);
    return [{ key: field.key, label: localized(field.label, locale), value }];
  });
}
```
Run `npm test -- review`. Expected: PASS.

- [ ] **Step 3: Admin queries** (these use the admin's own session, so row-level security applies)

`src/features/applications/admin-queries.ts`:
```ts
import "server-only";
import type { Locale } from "@/i18n/config";
import { formDefinition } from "@/features/forms/definition";
import { localized, localizedText, type LocalizedText } from "@/lib/i18n/localized";
import { createServerSupabase } from "@/lib/supabase/server";
import { describeAnswers, type ApplicationStatus } from "./review";

export type ApplicationRow = {
  id: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  submittedAt: string;
  professionName: LocalizedText;
};

export async function listApplications(status?: ApplicationStatus): Promise<ApplicationRow[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("applications")
    .select("id, full_name, email, status, submitted_at, profession:professions(name)")
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    status: row.status,
    submittedAt: row.submitted_at!,
    professionName: localizedText.parse(row.profession?.name),
  }));
}

export type ApplicationDetail = ApplicationRow & {
  phone: string | null;
  locale: string;
  adminNotes: string;
  answers: { key: string; label: string; value: string }[];
  files: { label: string; name: string; url: string | null }[];
};

export async function getApplicationDetail(
  id: string,
  locale: Locale,
  yesNo: { yes: string; no: string },
): Promise<ApplicationDetail | null> {
  const supabase = await createServerSupabase();
  const { data: row } = await supabase
    .from("applications")
    .select(
      "id, full_name, email, phone, locale, status, submitted_at, admin_notes, answers, profession:professions(name), form:profession_forms(schema), files:application_files(field_key, storage_path)",
    )
    .eq("id", id)
    .not("submitted_at", "is", null)
    .maybeSingle();
  if (!row) return null;

  const definition = formDefinition.safeParse(row.form?.schema);
  const fields = definition.success ? definition.data.fields : [];
  const fileLabel = (key: string) => {
    const field = fields.find((f) => f.key === key);
    return field ? localized(field.label, locale) : key;
  };

  const files = await Promise.all(
    row.files.map(async (file) => {
      const { data } = await supabase.storage.from("applications").createSignedUrl(file.storage_path, 600);
      return { label: fileLabel(file.field_key), name: file.storage_path.split("/").pop()!, url: data?.signedUrl ?? null };
    }),
  );

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    locale: row.locale,
    status: row.status,
    submittedAt: row.submitted_at!,
    adminNotes: row.admin_notes,
    professionName: localizedText.parse(row.profession?.name),
    answers: definition.success ? describeAnswers(definition.data, row.answers as Record<string, unknown>, locale, yesNo) : [],
    files,
  };
}
```

- [ ] **Step 4: Status/notes action + form**

`src/features/applications/admin-actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { fail, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import { APPLICATION_STATUSES } from "./review";

const updateInput = z.object({
  id: z.guid(),
  locale: z.enum(locales),
  status: z.enum(APPLICATION_STATUSES),
  adminNotes: z.string().max(10000),
});

export async function updateApplication(_prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>> {
  const parsed = updateInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("invalid");
  const { id, locale, status, adminNotes } = parsed.data;
  await requireAdmin(locale);

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("applications").update({ status, admin_notes: adminNotes }).eq("id", id);
  if (error) {
    console.error("update application failed", error);
    return fail("server_error");
  }
  revalidatePath(`/${locale}/admin/applications`, "layout");
  return ok(null);
}
```

`src/features/applications/ReviewForm.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Select, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { updateApplication } from "./admin-actions";
import { APPLICATION_STATUSES, type ApplicationStatus } from "./review";

type Props = { id: string; locale: Locale; status: ApplicationStatus; adminNotes: string };

export function ReviewForm({ id, locale, status, adminNotes }: Props) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(updateApplication, null);

  return (
    <form action={action}>
      <Stack gap="md">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="locale" value={locale} />
        <Field id="review-status" label={t("status")}>
          <Select id="review-status" name="status" defaultValue={status}>
            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
          </Select>
        </Field>
        <Field id="review-notes" label={t("notes")}>
          <Textarea id="review-notes" name="adminNotes" defaultValue={adminNotes} />
        </Field>
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </Stack>
    </form>
  );
}
```

- [ ] **Step 5: Pages**

`src/app/[locale]/admin/(protected)/applications/page.tsx`:
```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { listApplications } from "@/features/applications/admin-queries";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/features/applications/review";
import { localized } from "@/lib/i18n/localized";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string }> };

export default async function ApplicationsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const { status: rawStatus } = await searchParams;
  const status = APPLICATION_STATUSES.includes(rawStatus as ApplicationStatus) ? (rawStatus as ApplicationStatus) : undefined;
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listApplications(status)]);

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("applications")}</Text>
      <form>
        <Stack direction="row" gap="sm">
          <Select name="status" defaultValue={status ?? ""} aria-label={t("status")}>
            <option value="">{t("allStatuses")}</option>
            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
          </Select>
          <Button type="submit" variant="secondary">{t("filter")}</Button>
        </Stack>
      </form>
      {rows.length === 0 ? <Text tone="muted">{t("empty")}</Text> : null}
      <Stack as="ul" gap="sm">
        {rows.map((row) => (
          <li key={row.id}>
            <Stack direction="row" gap="md">
              <Link href={`/admin/applications/${row.id}`}>{row.fullName}</Link>
              <Text as="span" tone="muted">{localized(row.professionName, locale)}</Text>
              <Text as="span">{t(`statuses.${row.status}`)}</Text>
              <Text as="span" tone="muted" size="sm">{format.dateTime(new Date(row.submittedAt), { dateStyle: "medium", timeStyle: "short" })}</Text>
            </Stack>
          </li>
        ))}
      </Stack>
    </Stack>
  );
}
```

`src/app/[locale]/admin/(protected)/applications/[id]/page.tsx`:
```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { getApplicationDetail } from "@/features/applications/admin-queries";
import { ReviewForm } from "@/features/applications/ReviewForm";
import { localized } from "@/lib/i18n/localized";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, tApply, format] = await Promise.all([getTranslations("admin"), getTranslations("apply"), getFormatter()]);
  const app = await getApplicationDetail(id, locale, { yes: tApply("yes"), no: tApply("no") });
  if (!app) notFound();

  return (
    <Stack gap="lg">
      <Link href="/admin/applications">{t("back")}</Link>
      <Text as="h1" size="xl">{app.fullName}</Text>
      <Text tone="muted">
        {localized(app.professionName, locale)} · {app.email}
        {app.phone ? ` · ${app.phone}` : ""} · {app.locale.toUpperCase()} · {t("submittedAt")}{" "}
        {format.dateTime(new Date(app.submittedAt), { dateStyle: "medium", timeStyle: "short" })}
      </Text>

      <Text as="h2" size="lg">{t("answers")}</Text>
      <dl>
        {app.answers.map((a) => (
          <div key={a.key}>
            <dt><strong>{a.label}</strong></dt>
            <dd>{a.value}</dd>
          </div>
        ))}
      </dl>

      <Text as="h2" size="lg">{t("documents")}</Text>
      <Stack as="ul" gap="xs">
        {app.files.map((f) => (
          <li key={f.name}>
            {f.label}: {f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a> : f.name}
          </li>
        ))}
      </Stack>

      <ReviewForm id={app.id} locale={locale} status={app.status} adminNotes={app.adminNotes} />
    </Stack>
  );
}
```

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build
npm run dev
```
Manual: sign in as the owner. The application from Task 9 is listed. Open it: the answers show English labels, and "CV (PDF)" links to the file, which opens. Change the status to "Reviewing", add a note and save; "Saved." appears and the list shows "Reviewing". Filtering by "New" hides it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(admin): applications inbox with answers, signed file links, status and notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 12: End-to-end smoke test + README

**Files:**
- Create: `playwright.config.ts`, `e2e/global-setup.ts`, `e2e/apply-and-review.spec.ts`
- Modify: `README.md` (replace), `package.json` (dev dep `@playwright/test`)

**Interfaces:**
- Consumes: `ensureAdmin` (Task 5), the seed profession `pflege` (Task 5), and the DOM contracts from Tasks 9–10.

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Config + global setup**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";

process.loadEnvFile(".env.local");

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm run dev", url: "http://localhost:3000/en", reuseExistingServer: true, timeout: 120_000 },
});
```

`e2e/global-setup.ts`:
```ts
import { ensureAdmin } from "../scripts/lib/ensure-admin";

export const E2E_ADMIN = { email: "e2e-owner@iprince.local", password: "e2e-password-123" };

export default async function globalSetup() {
  await ensureAdmin({ ...E2E_ADMIN, role: "owner", displayName: "E2E Owner" });
}
```

- [ ] **Step 3: Write the smoke test**

`e2e/apply-and-review.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "./global-setup";

test("a candidate applies and an admin reviews the application", async ({ page }) => {
  const name = `E2E Candidate ${Date.now()}`;

  await page.goto("/en/apply/pflege");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nursing & healthcare");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill("candidate@example.com");
  await page.getByLabel("German level").selectOption("B2");
  await page.getByLabel("Years of experience").fill("4");
  await page.getByLabel("Specialisation").selectOption("intensive");
  await page.getByLabel("Recognition process already started").check();
  await page.getByLabel("CV (PDF)").setInputFiles({
    name: "cv.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% e2e test\n"),
  });
  await page.getByRole("button", { name: "Send application" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you", { timeout: 15_000 });

  await page.goto("/en/admin/login");
  await page.locator("#admin-email").fill(E2E_ADMIN.email);
  await page.locator("#admin-password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/applications$/);

  await page.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByText("Intensive care")).toBeVisible();
  const cvLink = page.getByRole("link", { name: /cv\.pdf$/ });
  await expect(cvLink).toBeVisible();
  const response = await page.request.get((await cvLink.getAttribute("href"))!);
  expect(response.status()).toBe(200);

  await page.locator("#review-status").selectOption("reviewing");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
});

test("unknown professions return 404", async ({ page }) => {
  const response = await page.goto("/en/apply/does-not-exist");
  expect(response?.status()).toBe(404);
});

test("admin pages require sign-in", async ({ page }) => {
  await page.goto("/en/admin/applications");
  await expect(page).toHaveURL(/\/en\/admin\/login$/);
});
```

Note: `page.getByLabel("Email")` must match only the applicant email field. The label is exactly "Email" and no other label contains "Email" on the apply page. If Playwright reports a strict-mode violation, use `page.getByLabel("Email", { exact: true })`.

- [ ] **Step 4: Run it**

With `npx supabase start` running:
```bash
npm run test:e2e
```
Expected: 3 passed. On failure, open `npx playwright show-trace test-results/**/trace.zip`.

- [ ] **Step 5: README**

`README.md` (replace):
````markdown
# iPrince Recruiting

Next 16 · React 19 · StyleX · Supabase · next-intl (de/en)

## Local setup

Requires Node 22+ and Docker.

```bash
npm install
npx supabase start          # local Postgres, Auth, Storage (Docker)
npm run db:env              # writes .env.local from the running stack
npm run admin:create -- --email you@example.com --password 'choose-one' --role owner --name 'Your Name'
npm run dev                 # http://localhost:3000/en
```

- Apply: `/en/apply/pflege` (seeded sample profession)
- Admin: `/en/admin`
- Supabase Studio: http://127.0.0.1:54323
- Emails (Inbucket): http://127.0.0.1:54324

## Scripts

| Script | What it does |
| --- | --- |
| `npm run check` | typecheck, lint, unit tests, DB policy tests, production build |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `npm run test:db` | pgTAP security-rule tests (`supabase/tests`) |
| `npm run test:e2e` | Playwright smoke test (needs `supabase start`) |
| `npx supabase db reset` | re-apply migrations + `supabase/seed.sql` |
| `npm run db:types` | regenerate `src/lib/supabase/database.types.ts` after schema changes |

## Architecture

- `src/features/<domain>/`: pure logic (tested), `queries.ts` (server reads), `actions.ts` (server actions returning `ActionResult`).
- Professions and their application forms are **admin-managed data**. Forms are versioned JSON (`profession_forms`); published versions are immutable.
- Public submissions go through server actions using the service role after validation, a honeypot and rate limiting. Admin code uses the signed-in user's session, so row-level security applies.
- `src/proxy.ts` (Next 16's replacement for middleware) handles locale routing, session refresh and an optimistic admin redirect. `requireAdmin()` is the real guard.
- Design tokens live in `src/ui/tokens.stylex.ts` (placeholders until the design system lands).

## Production Supabase

Create a project, then run `npx supabase link --project-ref <ref>` and `npx supabase db push`. Put the URL, anon key and service-role key into the hosting environment (see `.env.example`). Disable public sign-ups in Auth settings.
````

If Task 1 needed the `--webpack` fallback, add a "Known issues" line to the README explaining why.

- [ ] **Step 6: Full check + commit**

```bash
npm run check && npm run test:e2e
git add -A
git commit -m "test: Playwright apply-and-review smoke test; README setup guide

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected: every check passes before committing.

---

## Deferred to Plans 2 and 3

- **Plan 2 (admin: professions + form builder):**
  - profession CRUD (activate, feature, sort, open positions);
  - a form builder that edits a draft `profession_forms` row, then publishes it (a new version plus `current_form_id`);
  - team page (owner invites an editor via `auth.admin.inviteUserByEmail`);
  - cleanup job for abandoned unsubmitted applications and their orphaned storage objects.
- **Plan 3 (content):**
  - blog admin and public pages;
  - reviews moderation and a public testimonials block;
  - employer lead and contact forms (public actions reusing `hit_rate_limit` + honeypot) and their admin inboxes;
  - site-content editor;
  - real site chrome once the design system arrives.
