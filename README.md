# iPrince Recruiting

Next 16 · React 19 · Tailwind 4 · Supabase · next-intl (de/en)

## Local setup

Requires Node 22+ and Docker.

```bash
npm install
npx supabase start          # local Postgres, Auth, Storage (Docker)
npm run db:env              # writes .env.local from the running stack
npm run admin:create -- --email you@example.com --password 'choose-a-long-one' --role owner --name 'Your Name'
npm run dev                 # http://localhost:3000/en
```

- Apply: `/en/apply/pflege` (seeded sample profession)
- Admin: `/en/admin`
- Supabase Studio: http://127.0.0.1:54323
- Emails (Inbucket): http://127.0.0.1:54324

## Scripts

| Script | What it does |
| --- | --- |
| `npm run check` | typecheck, lint, unit tests, DB policy tests, production build (needs `npx supabase start` running) |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `npm run test:db` | pgTAP security-rule tests (`supabase/tests`) |
| `npm run test:e2e` | Playwright smoke test (needs `npx supabase start`; refuses non-local Supabase URLs) |
| `npx supabase db reset` | re-apply migrations + `supabase/seed.sql` |
| `npm run db:types` | regenerate `src/lib/supabase/database.types.ts` after schema changes |
| `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/cleanup` | run the cleanup job by hand |

## Architecture

- `src/features/<domain>/`: pure logic (tested), `queries.ts` (server reads), `actions.ts` (server actions returning `ActionResult`).
- Professions and their application forms are **admin-managed data**. Forms are versioned JSON (`profession_forms`); published versions are immutable.
- Public submissions go through server actions using the service role after validation, a honeypot and rate limiting. Admin code uses the signed-in user's session, so row-level security applies.
- `src/proxy.ts` (Next 16's replacement for middleware) handles locale routing, session refresh and an optimistic admin redirect. `requireAdmin()` is the real guard.
- Styling: Tailwind 4. Tokens in `src/styles/tokens.css` (`@theme`), design-system classes in `src/styles/components.css` (`@layer components`); primitives in `src/ui` map props to those classes, pages use utilities for layout. `cn()` = clsx + tailwind-merge.
- Site settings (`site_settings`, one row): the owner picks the chat channel (WhatsApp, tawk.to or none) under Admin → Settings. tawk.to only loads after CookieScript consent (`COOKIESCRIPT_ID`, `TAWK_*` in `.env.example`).
- SEO and analytics: `src/lib/seo.ts` builds page metadata (canonical, hreflang, Open Graph), `src/app/sitemap.ts` / `robots.ts` (only production is indexable, admin never). Vercel Web Analytics is cookieless and always on for the public site; GA4 (`GA_MEASUREMENT_ID`) loads only after CookieScript "performance" consent. Conversion events go through `track()` in `src/features/analytics/track.ts` and never carry personal data.
- Site content (`site_content`, one row per section): home copy, contact details, photos and the legal pages are edited under Admin → Content. Keys without a row show the copy in `messages/*.json`. Only the owner edits Impressum and Datenschutz. `npm run check:legal` fails while either still contains `[PLATZHALTER`; run it against production before launch.

## Production Supabase

Create a project, then run `npx supabase link --project-ref <ref>` and `npx supabase db push`. Put the URL, anon key and service-role key into the hosting environment (see `.env.example`). Disable public sign-ups in Auth settings.

- Bootstrap the first owner by running `admin:create` with the production env vars in a one-off shell (never commit them).
- Set Auth minimum password length to 12 or more and keep sign-ups disabled.
- Auth → URL configuration: add `https://<your-domain>/**` to the redirect URLs. Auth → Email templates → Invite user: paste `supabase/templates/invite.html` (the link must stay `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=invite`). Every origin admins use (apex and www, custom domains) must be in Redirect URLs; preview URLs are not supported for invites. An origin missing from the list makes GoTrue fall back to the Site URL and the invite link is malformed.
- Auth → Email → OTP expiration = 86400 seconds, so invite links last 24 hours as the email says.
- Invite emails need working SMTP in production (Supabase's built-in sender is rate-limited); configure custom SMTP before inviting staff.
- Keep Auth `refresh_token_reuse_interval` above 0 (default 10s); the proxy relies on it (see `src/lib/supabase/proxy.ts`).
- Confirm table privileges for `anon`, `authenticated` and `service_role`; the migrations rely on Supabase's default grants.
- The rate limit trusts the first `x-forwarded-for` hop (correct on Vercel; revisit behind other proxies).
- Set `CRON_SECRET` (`openssl rand -hex 32`) in the Vercel production environment. Vercel Cron calls `/api/cron/cleanup` daily at 03:00 UTC (`vercel.ts`). It deletes unsubmitted applications and unreferenced uploads older than 24 hours (gone within 48 hours), contact messages 6 months after their last change, and closed or archived employer enquiries 12 months after their last change (open enquiries are kept). The privacy policy must state these periods. Check the first run in the Vercel logs.
- Staff notifications for new enquiries and messages: set `RESEND_API_KEY`, `NOTIFY_EMAIL_TO` and `NOTIFY_EMAIL_FROM` (a sender on a domain verified in Resend; the same domain can serve Supabase's custom SMTP). Without them, submissions are still saved and nobody is emailed.
