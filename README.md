# iPrince Recruiting

Next 16 · React 19 · StyleX · Supabase · next-intl (de/en)

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
| `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/cleanup-applications` | run the cleanup job by hand |

## Architecture

- `src/features/<domain>/`: pure logic (tested), `queries.ts` (server reads), `actions.ts` (server actions returning `ActionResult`).
- Professions and their application forms are **admin-managed data**. Forms are versioned JSON (`profession_forms`); published versions are immutable.
- Public submissions go through server actions using the service role after validation, a honeypot and rate limiting. Admin code uses the signed-in user's session, so row-level security applies.
- `src/proxy.ts` (Next 16's replacement for middleware) handles locale routing, session refresh and an optimistic admin redirect. `requireAdmin()` is the real guard.
- Design tokens live in `src/ui/tokens.stylex.ts` (placeholders until the design system lands).

## Production Supabase

Create a project, then run `npx supabase link --project-ref <ref>` and `npx supabase db push`. Put the URL, anon key and service-role key into the hosting environment (see `.env.example`). Disable public sign-ups in Auth settings.

- Bootstrap the first owner by running `admin:create` with the production env vars in a one-off shell (never commit them).
- Set Auth minimum password length to 12 or more and keep sign-ups disabled.
- Keep Auth `refresh_token_reuse_interval` above 0 (default 10s); the proxy relies on it (see `src/lib/supabase/proxy.ts`).
- Confirm table privileges for `anon`, `authenticated` and `service_role`; the migrations rely on Supabase's default grants.
- The rate limit trusts the first `x-forwarded-for` hop (correct on Vercel; revisit behind other proxies).
- Set `CRON_SECRET` (`openssl rand -hex 32`) in the Vercel production environment. Vercel Cron calls `/api/cron/cleanup-applications` daily at 03:00 UTC (`vercel.ts`); it deletes unsubmitted applications and unreferenced uploads older than 24 hours, so they are gone within 48 hours. The privacy policy must say so. Check the first run in the Vercel logs.
