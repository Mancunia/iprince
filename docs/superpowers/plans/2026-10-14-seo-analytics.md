# SEO + analytics (2e, SEO slice) Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Search engines get canonical, hreflang-linked, structured pages and a sitemap; admin and preview deployments stay out of the index. The site counts visits cookielessly with Vercel Web Analytics, adds GA4 only after CookieScript "performance" consent, and tracks four conversion events without personal data.

**Spec:** `docs/superpowers/specs/2026-10-14-seo-analytics-design.md`. Roadmap: `docs/superpowers/plans/2026-10-01-roadmap.md` §2e.

## Global Constraints

- Branch `feat/seo-analytics`. Never push, merge or deploy unasked.
- `siteUrl()` is the only origin source. Relative metadata URLs resolve against `metadataBase`.
- Analytics never receives personal data. Event props are whitelisted: `profession` (slug) and `channel`.
- GA4 never loads without CookieScript **and** "performance" consent. Vercel Analytics renders in the `(site)` layout only.
- Every new string goes into both `en.json` and `de.json` (the parity test enforces this).
- Next 16: the metadata docs live under `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/` and the JSON-LD guide is at `01-app/02-guides/json-ld.md`.
- `npm run check` passes before each commit. Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Task 1: SEO helpers (TDD)

- [ ] `src/lib/seo.test.ts`, then `src/lib/seo.ts`:
  - `localeAlternates(locale, path)` → canonical `/<locale><path>`, languages `de`, `en`, `x-default` (= `/en<path>`). `path` `""` for home.
  - `pageMetadata({ locale, path, title, description, image?, type? })` → `{ title, description, alternates, openGraph: { type, url, title, description, locale, siteName, images }, twitter: { card: "summary_large_image" } }`.
  - `jsonLdString(data)` → `JSON.stringify` with `<` replaced by `<`.
  - `sitemapEntries(origin, { professions, posts })` (pure) → `MetadataRoute.Sitemap`.
- [ ] Commit `feat(seo): metadata, alternates and sitemap helpers`.

## Task 2: Env + integrations

- [ ] Test-first in `src/env.test.ts`. Add `GA_MEASUREMENT_ID` (`^G-[A-Z0-9]{4,20}$`) and `GOOGLE_SITE_VERIFICATION` (`^[A-Za-z0-9_-]{10,100}$`) to `readIntegrationsEnv`, returned as `gaId` / `googleVerification` (null when unset).
- [ ] Update the fallback shape in `src/features/site-settings/queries.ts` and `.env.example`.
- [ ] `gaEnabled(integrations)` in `src/features/site-settings/settings.ts`: requires both `cookieScriptId` and `gaId`. Unit test.

## Task 3: Metadata across pages

- [ ] Root layout: title template + default, `openGraph.siteName`, default OG image `/logo/iprince-mark.png`, and `verification.google` from env.
- [ ] `generateMetadata` via `pageMetadata` on home, employers, contact and apply (profession name). Refactor blog index and post, imprint and privacy to the helper.
- [ ] Admin `(protected)` and `(auth)` layouts: `robots: { index: false, follow: false }`.
- [ ] Add the new i18n `metadata.*` keys in both languages.

## Task 4: robots, sitemap, JSON-LD

- [ ] `src/app/robots.ts`: in production, allow `/` and disallow `/en/admin`, `/de/admin` and `/api/`, with a sitemap URL. Otherwise disallow `/`.
- [ ] `listSitemapPosts()` in blog queries (slug, updated_at, live only) and `listActiveProfessions` reuse. `src/app/sitemap.ts` calls `sitemapEntries`.
- [ ] `src/features/seo/JsonLd.tsx`. Use `Organization` on home and `BlogPosting` on the blog post page.
- [ ] Commit `feat(seo): sitemap, robots, page metadata and structured data`.

## Task 5: Analytics

- [ ] `npm i @vercel/analytics`. Add `<Analytics />` to the `(site)` layout, with `beforeSend` dropping `/admin` URLs.
- [ ] `src/features/analytics/track.ts` (+ test): Vercel `track` always; `window.gtag` when present; props filtered to the whitelist.
- [ ] `src/features/site/GoogleAnalytics.tsx`: gated by consent, Consent Mode defaults, manual `page_view` on pathname change, reload on withdrawal. Rendered when `gaEnabled`.
- [ ] Extend `third-party.d.ts` with `gtag` / `dataLayer`.
- [ ] Add the call sites in `ApplyForm`, `LeadForm`, `ContactForm`, `WhatsAppButton` and `TawkChat`.
- [ ] Commit `feat(analytics): Vercel Web Analytics, consent-gated GA4 and conversion events`.

## Task 6: Privacy policy, docs, e2e

- [ ] `legal-draft.ts`: add Vercel Web Analytics + Google Analytics (de + en).
- [ ] README integrations line. Roadmap 2e status. Phase 3 lines: GA cookies set to "performance" in CookieScript, GSC verification, submit the sitemap.
- [ ] `e2e/seo.spec.ts`: sitemap, robots, hreflang + ld+json on home, noindex on admin login, no googletagmanager request without consent.
- [ ] `npm run check`, `npm run test:e2e`, then commit and request a review.
