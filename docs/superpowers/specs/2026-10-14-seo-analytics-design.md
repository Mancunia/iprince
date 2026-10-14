# SEO + analytics — design

Date: 2026-10-14 · Roadmap 2e (SEO slice) · Branch `feat/seo-analytics`

## Context

Roadmap phase 2e (`docs/superpowers/plans/2026-10-01-roadmap.md`) calls for `sitemap.ts`, `robots.ts`, per-page metadata and hreflang before launch. Analytics has never been specced. Current state:
- Root `[locale]/layout.tsx` sets only `metadataBase`, title and description. Blog index, blog post, imprint and privacy have `generateMetadata`. Home, contact, employers and `apply/[slug]` have none.
- There is no sitemap, robots, JSON-LD or analytics. Admin pages are indexable.
- CookieScript consent is already in place (`src/features/site/consent.ts`: `useConsent(category)`, `CookieBanner`). tawk.to uses it for the "functionality" category, and that is the pattern GA4 will copy for "performance".

Decisions (user, 2026-10-14):
- **Vercel Web Analytics** (cookieless, always on), plus **GA4** loaded only after "performance" consent.
- Events: application submitted, employer enquiry sent, contact message sent, chat/WhatsApp opened.
- Google Search Console verification and JSON-LD are in scope.
- Workflow: spec → plan → build on `feat/seo-analytics`.

## Design

### SEO

**Shared helper `src/lib/seo.ts`** (pure, unit-tested):
- `localeAlternates(path)` returns `{ canonical: /<locale><path>, languages: { de, en, "x-default": /en<path> } }`.
- `pageMetadata({ locale, path, title, description, image? })` builds the full `Metadata` (alternates, openGraph with `locale`/`siteName`, twitter `summary_large_image`).
- Refactor the blog post page's inline alternates (`src/app/[locale]/(site)/blog/[slug]/page.tsx:21`) to use it.

**Root layout (`src/app/[locale]/layout.tsx`):**
- Title template `%s · iPrince Recruiting`, default `openGraph.siteName`, and icons from `public/logo/iprince-mark.png`. Alternatively add an `app/icon.png` / `apple-icon.png` file convention (check `01-metadata/app-icons.md`).
- `verification.google` comes from the new optional env `GOOGLE_SITE_VERIFICATION`.

**Per-page `generateMetadata`:** home, contact, employers and `apply/[slug]` (profession name and description via `localized()`). New `metadata.*` keys go in both `en.json` and `de.json`.

**Admin `noindex`:** `robots: { index: false, follow: false }` in `admin/(protected)/layout.tsx` and `admin/(auth)/layout.tsx`, plus `Disallow: /*/admin` in robots.

**`src/app/robots.ts`:** allow `/`, disallow `/*/admin` and `/api/`, and point to `siteUrl()/sitemap.xml`. On non-production deployments (`VERCEL_ENV !== "production"`) return `disallow: "/"` so previews are not indexed.

**`src/app/sitemap.ts`:** static public routes (home, employers, contact, blog, imprint, privacy) × de/en with `alternates.languages`. It also includes active professions (`/apply/<slug>`) and live blog posts (`lastModified` = `updated_at`). Add a small `listSitemapEntries()` query in `features/blog/queries.ts` and `features/professions` (or reuse the existing public list queries). The proxy matcher already skips paths with a dot, so `/sitemap.xml` and `/robots.txt` bypass next-intl.

**JSON-LD:** a `src/features/seo/JsonLd.tsx` server component writes `<script type="application/ld+json">` with `<` escaped as `<`.
- `Organization` (name, logo, url, contact details from site_content) on the home page.
- `BlogPosting` (headline, datePublished, dateModified, image, author) on the blog post page.
- `BreadcrumbList` is optional; skip it unless it costs nothing.

**`siteUrl()`** (`src/lib/site-url.ts`) stays the single origin source. `VERCEL_PROJECT_PRODUCTION_URL` already resolves to the custom domain.

### Analytics

**Env (`src/env.ts`, `readIntegrationsEnv`):** add optional `GA_MEASUREMENT_ID` (regex `^G-[A-Z0-9]{4,20}$`) and `GOOGLE_SITE_VERIFICATION` (token charset). Update `env.test.ts` and `.env.example`. GA4 requires `COOKIESCRIPT_ID`, so it stays off without the consent banner, the same rule as `tawkMissing`.

**Vercel Web Analytics:** install `@vercel/analytics` and render `<Analytics />` in the `(site)` layout only. Admin pages are not tracked. Use `beforeSend` to drop any URL containing `/admin`, as a second guard.

**GA4 (`src/features/site/GoogleAnalytics.tsx`, client):**
- `useConsent("performance")`. Once consent is granted, inject `gtag.js` via `next/script` with Consent Mode v2 defaults set to denied (granted for analytics_storage when consented), `anonymize_ip`, and `send_page_view: false`.
- Page views are sent manually on `usePathname()` changes, because the App Router navigates client-side.
- When consent is withdrawn (`CookieScriptReject`), set consent to denied and reload, as `TawkChat` does, so GA cookies stop.
- Rendered from the `(site)` layout next to `CookieBanner` only when both IDs exist.
- Extend `src/types/third-party.d.ts` with `gtag` / `dataLayer`.

**Event API `src/features/analytics/track.ts`** (client, unit-tested with mocked globals):
- `track(event: AnalyticsEvent, props?)` sends to Vercel `track()` always and to `window.gtag("event", …)` only if it is present (i.e. consented).
- `AnalyticsEvent` = `"application_submitted" | "employer_enquiry_sent" | "contact_message_sent" | "chat_opened"`. The props whitelist is `profession` slug and `channel` (`whatsapp` | `tawk`). **No personal data.**
- Call sites:
  - `ApplyForm.tsx` after `finalized.ok`
  - `LeadForm.tsx` / `ContactForm.tsx` in an effect when `state?.ok` flips to true (fires once)
  - `WhatsAppButton.tsx` on click
  - `TawkChat.tsx` when the chat opens

**Privacy policy:** add Vercel Web Analytics (cookieless, aggregated) and Google Analytics (consent-based, "performance" category, IP anonymised, US transfer under the DPF) to `src/features/site-content/legal-draft.ts` (de + en). Flag this to the user for legal review. Also add a Phase 3 checklist line: CookieScript must classify GA cookies as "performance".

## Acceptance


- Unit: `seo.ts` alternates/x-default, the env schema (valid and invalid GA ID), `track()` (gtag absent → Vercel only; props whitelist), and the sitemap builder (pure function given rows).
- `npm run check` (needs `npx supabase start`).
- e2e (new `e2e/seo.spec.ts`):
  - `/sitemap.xml` lists `/de/blog/<live slug>` but not a draft
  - `/robots.txt` disallows admin
  - the home page has `hreflang` links and `ld+json`
  - admin login has `noindex`
  - with `GA_MEASUREMENT_ID` set and no consent, no request goes to `googletagmanager.com`
- Manual: `npm run build && npm start`, view the source of home, employers, an apply page and a blog post; validate JSON-LD in Google's Rich Results Test on the preview deploy; check that Vercel Analytics records a page view on the preview.
