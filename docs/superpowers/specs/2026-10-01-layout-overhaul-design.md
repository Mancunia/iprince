# Layout Overhaul: Public Site and Admin

Date: 2026-10-01 · Branch: `feat/layout-overhaul` · Parent specs: `2026-09-30-foundation-design.md`, `2026-09-30-plan2-admin-design.md`, `2026-10-01-leads-contact-design.md`

## Goal
Replace the square "Blueprint" look (hairline cell grids, corner marks, duotone, condensed headings, dark employer door, dark admin sidebar) with a friendly, airy recruitment-agency look inspired by the "We Recruit" Webflow template: rounded cards, pill buttons, soft shadows, generous whitespace, photo-led sections. Covers every public page and every admin page. Adds one admin page (dashboard). **No migration, no change to server actions, routes (except `/admin`), or validation.**

## Decisions
| Topic | Decision |
|---|---|
| Palette | Keep navy (`accent-*`) as primary and gold (`gold-*`) as highlight. New white page background; pale navy (`accent-100`) and pale gold (`gold-100`) as alternating section tints |
| Typeface | DM Sans (400/500/700) via `next/font/google` for headings and body. Barlow and Barlow Condensed removed |
| Shape | Radius 12px cards, 8px inputs, `9999px` buttons/pills/tags/status. Square corners removed everywhere |
| Elevation | Two shadows: `shadow-card` (resting card), `shadow-raised` (hover, floating badges, dropdowns). Hairline borders only inside tables and dividers |
| Spacing | Tailwind default `--spacing: 4px` (replaces 3.4px). Sections `py-24 md:py-30`; container 1200px |
| Imagery | `<Photo slot>` primitive: renders `/public/photos/<slot>.jpg` if present (checked at build via a static manifest), else a rounded tinted placeholder with an icon. Duotone removed |
| Approach | Re-skin in place: rewrite `tokens.css` and `components.css` under the existing class names, delete Blueprint-only classes, rebuild page markup where layouts change |
| Employer door | `.door-employer` page theme retired. Dark navy survives only as the `.cta-banner` component |
| Admin shell | Light: white sidebar, grey canvas, white top bar, rounded content cards. Mobile: drawer |
| Admin home | `/admin` renders a dashboard (was a redirect). Login, set-password and the logo now land on `/admin` |
| Copy | New keys under `home.*` and `admin.dashboard.*` in `de` and `en`. No invented statistics; badges use generic claims ("Free for applicants") or live counts |
| Out of scope | Admin-uploadable images, dark mode, animations beyond hover/transition, form-builder behaviour changes, new public pages |

## 1. Visual system

### Tokens (`src/styles/tokens.css`)
- `@theme`: keep palette scales; add `--color-canvas: #f6f7f9` (admin and footer background). `--color-paper` becomes `#ffffff` as the page surface.
- Radii: `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 20px` (hero photo, CTA banner), `--radius-full: 9999px`.
- Shadows: `--shadow-card: 0 1px 2px rgb(16 24 40 / .04), 0 4px 16px rgb(16 24 40 / .06)`; `--shadow-raised: 0 8px 28px rgb(16 24 40 / .12)`.
- Type scale: `--text-4xl: clamp(40px, 6vw, 60px)` (hero), `--text-3xl: clamp(30px, 4vw, 40px)` (section), `--tracking-heading: -0.02em`, heading weight 700.
- `--spacing: 4px`. Every page and component using numeric spacing utilities is re-tuned by eye during the rewrite (values change by about 15%).
- Semantic aliases on `:root` stay (`--surface-*`, `--text-*`, `--action-*`) so `src/ui` primitives need no prop changes. The `.door-employer` alias block is deleted; `.cta-banner` defines its own inverse aliases.

### Fonts (`src/app/[locale]/layout.tsx`)
`DM_Sans` with `variable: "--font-dm-sans"`; `--font-heading` and `--font-body` both point to it.

### Component classes (`src/styles/components.css`)
Rewritten, same names where the concept survives:

| Class | New treatment |
|---|---|
| `.btn` | Pill, 44px min height, DM Sans 500 15px. `.btn-primary` navy fill; default = navy outline; `.btn-ghost` text only; `.btn-sm` 36px; `.btn-lg` 52px |
| `.card` | White, `radius-md`, `shadow-card`, padding 24px; `.card-link` adds hover lift (`shadow-raised`, `translateY(-2px)`) |
| `.tag`, `.status`, `.badge` | Pills. `.status` keeps its dot and colour variants |
| `.input`, `.select`, `.textarea` | `radius-sm`, 1px `neutral-300` border, navy focus ring (`outline 3px accent-200`) |
| `.check`, `.radio`, `.chip`, `.seg`, `.switch` | Rounded equivalents; chips are pills |
| `.notice` | `radius-md`, tinted background, no border |
| `.form-section` | Becomes a card; `.section-num` a 40px navy circle |
| `.stepper` | Rounded progress track with filled segment |
| `.data-table` | Lives inside a card; 14px/16px cell padding, row hover `canvas`, header row uppercase 12px muted |
| New: `.icon-chip` | 44px rounded square, `gold-100` background, `gold-700` icon (variants `-navy`) |
| New: `.eyebrow` | 14px 500 `accent-600` (replaces `.kicker` and `.kicker-rule`) |
| New: `.float-badge` | White pill card, `shadow-raised`, icon chip + two-line text; absolutely positioned on photos |
| New: `.cta-banner` | `radius-lg`, navy-900 with optional photo underlay at 25% opacity, inverse text, gold primary button |
| New: `.timeline` | Vertical line with numbered gold dots, alternating sides at `lg` |
| Deleted | `.blueprint` + corners, `.duotone`, `.cells`, `.trust-strip`, `.door-split`, `.door`, `.steps`, `.kicker-rule`, `.legal-strip`, `.side-count` |

### Primitives (`src/ui`)
- `Blueprint.tsx` deleted; its 8 call sites switch to `<Card>` (new `src/ui/Card.tsx`: `as`, `className`, `interactive?`).
- New `Photo.tsx`: `{ slot, alt, className, priority? }`. Reads `src/features/site/photos.ts` (a typed list of slots, each with `src | null`). Placeholder: `accent-100` background, centred `user` icon, same aspect ratio. Slots: `hero`, `feature-match`, `feature-advisors`, `steps`, `employer-banner`.
- New `Avatar.tsx`: initials in a navy-100 circle (admin lists, user card).
- `Button`, `Field`, `inputs`, `Status`, `Text` keep their APIs.

## 2. Public site

### Header (`SiteHeader.tsx`)
Sticky white, 72px. Logo left; centred nav (Professions `/#berufe`, How it works `/#ablauf`, Employers, Contact); right: `LangSwitch` (pill toggle) + "Apply now" `.btn-primary`. Shadow appears after scroll: a tiny client component `HeaderShadow` toggles `data-scrolled` on the header via IntersectionObserver on a sentinel. Below `md`: menu button opens `MobileNav` (client, `<dialog>` sheet with the same links + CTA; closes on navigation and Escape).

### Home (`(site)/page.tsx`)
1. **Hero**: `md:grid-cols-2`. Left: eyebrow, h1, lead, pills (Apply now → `#berufe`; outline WhatsApp), trust row (3 icon + text items: free, personal advisor, German/English). Right: `<Photo slot="hero">` at `radius-lg`, aspect 4/5, with two `.float-badge`s (live open-positions count; "Free for applicants").
2. **Stat strip**: 3 cards in a row, `-mt-12` overlapping the hero bottom on `md+`: open positions, professions, free of charge. Each with `.icon-chip`.
3. **Feature rows**: two rows, photo/text alternating (`feature-match`, `feature-advisors`); second photo carries a `.float-badge`.
4. **Professions** (`#berufe`): heading left, nothing right (no "view all" page exists). 3-column grid of `.card.card-link` job cards: tag ("Open"), icon chip, name, positions count, footer with pill "Apply". Empty state notice unchanged in content.
5. **How it works** (`#ablauf`): `.timeline` with the 3 existing steps; `<Photo slot="steps">` beside it at `lg`.
6. **Employer banner**: `.cta-banner` with `employer-banner` photo underlay; title, text, pills Employers / Contact.

### Employers (`employers/page.tsx`)
`accent-100` hero band: left eyebrow, h1, lead, benefit list with `gold-600` check icons; right the `LeadForm` in a white card (`shadow-raised`). Light theme throughout.

### Contact (`contact/page.tsx`)
Same two-column pattern: left heading + `ContactForm` card; right a WhatsApp card with icon chip and outline button.

### Apply (`apply/[slug]/page.tsx`)
`container-form` centred. Back pill, header card (icon chip, profession name, lead), then form sections as separate cards, rounded stepper, sticky actions bar with white background and top shadow.

### Footer (`SiteFooter.tsx`)
`canvas` background, dark text. Four columns (brand + tagline, pages, legal, contact), bottom bar with copyright and cookie settings link.

### Floating chat (`WhatsAppButton`, `ChatChannel`)
FAB becomes a pill with `shadow-raised`; consent panel becomes a card.

## 3. Admin

### Shell (`admin/(protected)/layout.tsx`)
- Grid `[248px_1fr]` at `xl`, `canvas` background.
- **Sidebar** (white, right hairline): logo → `/admin`; nav groups "Inbox" (Dashboard, Applications, Leads, Messages) and "Setup" (Professions; Team and Settings for owners), group labels 12px muted. `AdminNav` takes `groups` instead of `items`. Active item: `accent-100` pill, `accent-800` text; Dashboard is active only on exact `/admin`. New counts: gold pill badge. Bottom: user card (`Avatar`, name, role, sign-out icon button).
- **Mobile** (`< xl`): top bar with menu button opening `AdminDrawer` (client, `<dialog>` from the left containing the same sidebar content). Replaces `.admin-side-mobile`.
- **Page header**: new `src/features/admin-auth/AdminPageHeader.tsx` `{ title, back?: { href, label }, actions?: ReactNode }`, rendered by each page at the top of `main` as a white bar. The layout stays page-agnostic.

### Dashboard (`admin/(protected)/page.tsx`)
- Row 1: 4 stat cards (icon chip, number, label), each a link: new applications → `/admin/applications?status=new`, new leads → `/admin/leads?status=new`, new messages → `/admin/messages?status=new`, active professions → `/admin/professions`.
- Row 2 (`lg:grid-cols-2`): "Latest applications" card (5 rows: avatar, name, profession, status pill, relative time; "View all") and "Latest enquiries and messages" card (5 most recent across both, kind tag, status pill).
- Data, all under the admin session (RLS applies):
  - New `src/features/admin-dashboard/queries.ts`: `countDashboard()` returning `{ applications, leads, messages, activeProfessions }` (head-count queries in parallel; applications and leads/messages counted at status `new`). The layout switches from `countNew()` to `countDashboard()` for nav badges; `countNew()` is deleted.
  - `listRecentApplications(limit)` and `listRecentInbox(limit)` (two queries merged and sorted by `created_at` in TS).
- Redirect targets: `signIn` and `setPassword` success (`features/admin-auth/actions.ts`) and the signed-in check on `login/page.tsx` → `/admin`; `requireAdmin` unaffected. The applications detail back link stays on the list.

### List pages (applications, leads, messages, team)
`AdminPageHeader` + one card containing: status tabs row (links to `?status=…`, current tab `aria-current="page"`, "All" first) replacing the status `<select>`; the `.data-table`; empty state (icon chip, text, optional action). Name column gets an `Avatar`. Tabs show labels only (no per-status counts; out of scope).

### Detail pages (applications/[id], leads/[id], messages/[id])
`lg:grid-cols-[minmax(0,1fr)_340px]`. Main card: definition grid of fields, file links as chips (icon, name, size). Side column, `lg:sticky top-6`: "Review" card with existing review form; danger card with delete form. Form element ids (`#review-status`, `#lead-status`, `#message-status`) are kept.

### Professions
List as card grid (icon chip, name, positions, active status pill, "Edit" and "Edit form" links); "New profession" in the page header actions. Profession form and builder: each pane becomes a card; field rows get a grip icon and hover state. No behaviour change.

### Settings, team
Forms in cards with section headings; invite form in a card above the team table.

### Auth pages (`admin/(auth)/layout.tsx`)
`accent-100` full-height background, centred logo, white card `max-w-md` with the form.

## 4. Rollout and testing

### Order (one branch, commits per step, site usable after each)
1. Tokens, font, component classes, new primitives (`Card`, `Photo`, `Avatar`); delete Blueprint and migrate its call sites. Every page still renders (old markup, new skin).
2. Public chrome: header + mobile nav, footer, chat FAB.
3. Home page + new `home.*` copy (de, en).
4. Employers, contact, apply pages.
5. Admin shell, drawer, `AdminPageHeader`, auth layout.
6. Dashboard + queries + redirect change.
7. Admin list pages (tabs, avatars, empty states).
8. Admin detail pages, professions, builder, team, settings.

### Tests
- **Unit (Vitest)**: `Photo` slot resolution (src vs placeholder); `listRecentInbox` merge/sort/limit as a pure helper `mergeRecent(leads, messages, limit)`.
- **DB (pgTAP)**: none; no schema change.
- **E2E (Playwright)**: update expectations that post-login URL is `/en/admin/applications` (`helpers.ts`, `apply-and-review.spec.ts`, `team.spec.ts`) to `/en/admin`; navigate to lists via sidebar links by role/name. Add `dashboard.spec.ts`: after submitting an application, the dashboard's "New applications" card shows ≥ 1 and links to the filtered list. Add a mobile-viewport check that the site menu and admin drawer open and contain the nav links.
- **Manual**: `npm run check` green; visual pass of every page at 375px, 768px and 1280px in `de` and `en` (German strings are longer; check pills and nav don't wrap badly); keyboard pass of mobile nav, admin drawer and status tabs (focus visible, Escape closes dialogs); contrast check of gold on white (gold only as icon/background, text in `gold-700`+).

### Risks
- Spacing scale change touches every utility class with numeric spacing; step 1 must include a full visual sweep, not just the CSS rewrite.
- Stat-strip overlap and float badges can collide with long German strings; badges hide below `sm`.
- `next/image` with a missing photo must not 404 in production: `photos.ts` lists only files that exist, so the placeholder path never requests an image.
