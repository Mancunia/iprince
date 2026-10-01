# Layout Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the square "Blueprint" look with a rounded, airy recruitment-agency look (navy + gold, DM Sans, pill buttons, soft shadows, photo slots) on every public and admin page, and add an admin dashboard at `/admin`.

**Architecture:** Re-skin in place. `src/styles/tokens.css` and `src/styles/components.css` are rewritten under mostly the same class names, so `src/ui` primitives and the forms keep their APIs. Page markup is rebuilt where the layout changes. Admin chrome moves into a new `src/features/admin-shell/` folder (sidebar, drawer, page header, status tabs). No database migration; one new read-only query module for dashboard counts.

**Tech Stack:** Next 16 (App Router, `src/proxy.ts`), React 19, Tailwind 4 (`@theme` tokens + `@layer components`), next-intl 4 (de/en), Supabase, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-01-layout-overhaul-design.md`

## Global Constraints

- Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code (fonts: `01-app/**/fonts*`, images: `01-app/**/image*`). This Next version differs from training data.
- Branch: `feat/layout-overhaul` (already created; the spec commits are on it).
- Palette: keep `accent-*` (navy) as primary and `gold-*` as highlight. Gold is never used for body text on white; text in gold must be `gold-700` or darker.
- Typeface: DM Sans 400/500/700 via `next/font/google`, CSS variable `--font-dm-sans`. Barlow fonts removed.
- Shapes: cards `--radius-md` (12px), inputs `--radius-sm` (8px), buttons/pills/tags/status `--radius-full`. No square corners.
- Shadows: only `--shadow-card` and `--shadow-raised`.
- `--spacing: 4px` (replaces 3.4px).
- No migration, no change to server actions' inputs or validation, no route changes except `/admin` (dashboard instead of redirect).
- Every new user-visible string goes into **both** `src/i18n/messages/en.json` and `src/i18n/messages/de.json`. These files use a hand-formatted layout (small objects on one line); add keys with the Edit tool in the same style, never re-serialize the whole file.
- Icons come from `public/icons/<name>.svg` via `<Icon name>` (decorative, `aria-hidden`). Only names that exist there may be used.
- Avatars and icons are `aria-hidden`; accessible names of links used by e2e must stay exactly: applicant name, company name, sender name, `"Profession details"`, sidebar `"Enquiries <n>"` / `"Messages <n>"`.
- Element ids used by e2e stay: `#review-status`, `#lead-status`, `#lead-notes`, `#message-status`, `#admin-email`, `#admin-password`.
- `npm run check` needs `npx supabase start` running; `npm run test:e2e` needs it too and starts `npm run dev` itself.
- Commit after every task with a conventional message ending in `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Long German strings at 375px** (nav, pills, float badges, stat cards): no horizontal page scroll on `/de`, `/de/employers`, `/de/contact`, `/de/apply/pflege`. Pinned by the overflow test in Task 5.
2. **Missing photos** must never request an image (no 404s in production). Pinned by `photos.test.ts` (Task 1) and the "no failed image requests" e2e test (Task 4).
3. **A key added to one locale only** shows a raw key to German or English visitors. Pinned by the message-parity unit test (Task 3).
4. **Menus on mobile**: the site menu and admin drawer close on Escape and on following a link (also a link to the current page or an in-page anchor). Pinned by e2e tests in Task 3 (site) and Task 6 (admin).
5. **Garbage `?status=` values** (`?status=foo`, `?status=a&status=b`) must show the unfiltered list, never crash. Pinned by `status-param.test.ts` (Task 1).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/styles/tokens.css` | Design tokens (rewritten) |
| `src/styles/components.css` | Component classes (rewritten) |
| `src/ui/Card.tsx` | White rounded card wrapper (replaces `Blueprint.tsx`) |
| `src/ui/Avatar.tsx`, `src/ui/initials.ts` | Initials avatar + pure initials helper |
| `src/ui/EmptyState.tsx` | Centred icon + text for empty lists |
| `src/lib/status-param.ts` | Pure `?status=` parser shared by admin lists |
| `src/features/site/photos.ts`, `src/features/site/Photo.tsx` | Photo slot registry + `<Photo>` with placeholder |
| `src/features/site/HeaderShadow.tsx`, `src/features/site/MobileNav.tsx` | Header scroll state, mobile menu sheet |
| `src/features/admin-shell/AdminNav.tsx` | Grouped sidebar links (moved from `admin-auth`) |
| `src/features/admin-shell/AdminSidebar.tsx` | Sidebar content: logo, nav, user card |
| `src/features/admin-shell/AdminDrawer.tsx` | Mobile drawer `<dialog>` |
| `src/features/admin-shell/AdminPageHeader.tsx` | White title bar each admin page renders |
| `src/features/admin-shell/StatusTabs.tsx` | Status filter tabs for admin lists |
| `src/features/admin-dashboard/queries.ts` | `countDashboard()` (cached per request) |
| `src/features/admin-dashboard/recent.ts` | Pure `mergeRecent()` for the inbox card |
| `src/app/[locale]/admin/(protected)/page.tsx` | Dashboard |
| `e2e/layout.spec.ts`, `e2e/dashboard.spec.ts` | New e2e coverage |

---

### Task 1: Pure helpers and new primitives

**Files:**
- Create: `src/ui/initials.ts`, `src/ui/initials.test.ts`, `src/ui/Avatar.tsx`, `src/ui/Card.tsx`, `src/ui/EmptyState.tsx`
- Create: `src/lib/status-param.ts`, `src/lib/status-param.test.ts`
- Create: `src/features/site/photos.ts`, `src/features/site/photos.test.ts`, `src/features/site/Photo.tsx`

**Interfaces:**
- Produces:
  - `initials(name: string): string`
  - `Avatar({ name, className? })` renders `<span class="avatar" aria-hidden>`
  - `Card({ as?: ElementType, className?, children })` renders `<Tag class="card">`
  - `EmptyState({ icon: string, text: string, children?: ReactNode })`
  - `pickStatus<S extends string>(raw: string | string[] | undefined, allowed: readonly S[]): S | undefined`
  - `PHOTO_SLOTS`, `type PhotoSlot = "hero" | "feature-match" | "feature-advisors" | "steps" | "employer-banner"`, `PHOTOS: Record<PhotoSlot, string | null>`
  - `Photo({ slot: PhotoSlot, alt: string, className?, sizes?, priority? })`

- [ ] **Step 1: Write the failing tests**

`src/ui/initials.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { initials } from "./initials";

describe("initials", () => {
  it("takes the first letters of the first and last word", () => {
    expect(initials("Erika Muster")).toBe("EM");
    expect(initials("Anna Maria Schmidt")).toBe("AS");
  });
  it("uses one letter for a single word", () => expect(initials("madonna")).toBe("M"));
  it("handles accents and extra whitespace", () => expect(initials("  łukasz   żak ")).toBe("ŁŻ"));
  it("keeps emoji whole", () => expect(initials("😀 Smile")).toBe("😀S"));
  it("falls back to a question mark for an empty name", () => expect(initials("   ")).toBe("?"));
});
```

`src/lib/status-param.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { pickStatus } from "./status-param";

const STATUSES = ["new", "read", "archived"] as const;

describe("pickStatus", () => {
  it("returns an allowed status", () => expect(pickStatus("read", STATUSES)).toBe("read"));
  it("ignores unknown values", () => expect(pickStatus("foo", STATUSES)).toBeUndefined());
  it("ignores a missing value", () => expect(pickStatus(undefined, STATUSES)).toBeUndefined());
  it("ignores repeated parameters", () => expect(pickStatus(["new", "read"], STATUSES)).toBeUndefined());
  it("is case-sensitive", () => expect(pickStatus("NEW", STATUSES)).toBeUndefined());
});
```

`src/features/site/photos.test.ts`:
```ts
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PHOTO_SLOTS, PHOTOS } from "./photos";

describe("PHOTOS", () => {
  it("configures every slot", () => expect(Object.keys(PHOTOS).sort()).toEqual([...PHOTO_SLOTS].sort()));

  it.each(PHOTO_SLOTS)("%s is a placeholder or an existing file under public/photos", (slot) => {
    const src = PHOTOS[slot];
    if (src === null) return;
    expect(src).toMatch(/^\/photos\/[\w.-]+\.(jpe?g|png|webp|avif)$/);
    expect(existsSync(path.join(process.cwd(), "public", src))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/ui/initials.test.ts src/lib/status-param.test.ts src/features/site/photos.test.ts`
Expected: FAIL, "Failed to resolve import" for all three modules.

- [ ] **Step 3: Implement the helpers**

`src/ui/initials.ts`:
```ts
/** Up to two initials for an avatar: first letter of the first and the last word. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : "";
  return `${first}${last}`.toLocaleUpperCase();
}
```

`src/lib/status-param.ts`:
```ts
/** The ?status= value when it is one allowed status; anything else means "show all". */
export function pickStatus<S extends string>(raw: string | string[] | undefined, allowed: readonly S[]): S | undefined {
  return typeof raw === "string" && (allowed as readonly string[]).includes(raw) ? (raw as S) : undefined;
}
```

`src/features/site/photos.ts`:
```ts
/** Photo slots on the public site. Put the file in public/photos and set its path here; null shows a placeholder. */
export const PHOTO_SLOTS = ["hero", "feature-match", "feature-advisors", "steps", "employer-banner"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

export const PHOTOS: Record<PhotoSlot, string | null> = {
  hero: null,
  "feature-match": null,
  "feature-advisors": null,
  steps: null,
  "employer-banner": null,
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/ui/initials.test.ts src/lib/status-param.test.ts src/features/site/photos.test.ts`
Expected: PASS (photos: 1 + 5 tests, the 5 return early because all slots are null).

- [ ] **Step 5: Add the components**

`src/ui/Avatar.tsx`:
```tsx
import { cn } from "./cn";
import { initials } from "./initials";

/** Initials in a circle. Decorative: the name is always shown as text next to it. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={cn("avatar", className)}>{initials(name)}</span>;
}
```

`src/ui/Card.tsx`:
```tsx
import type { ElementType, ReactNode } from "react";
import { cn } from "./cn";

/** White rounded surface with a soft shadow. As a link (<a class="card">) it lifts on hover. */
export function Card({ as: Tag = "div", className, children }: { as?: ElementType; className?: string; children: ReactNode }) {
  return <Tag className={cn("card", className)}>{children}</Tag>;
}
```

`src/ui/EmptyState.tsx`:
```tsx
import type { ReactNode } from "react";
import { Icon } from "./Icon";

/** Centred placeholder for an empty list. */
export function EmptyState({ icon, text, children }: { icon: string; text: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="icon-chip icon-chip-navy icon-chip-lg"><Icon name={icon} size={28} /></span>
      <p>{text}</p>
      {children}
    </div>
  );
}
```

`src/features/site/Photo.tsx`:
```tsx
import Image from "next/image";
import { Icon } from "@/ui/Icon";
import { cn } from "@/ui/cn";
import { PHOTOS, type PhotoSlot } from "./photos";

type Props = { slot: PhotoSlot; alt: string; className?: string; sizes?: string; priority?: boolean };

/** Rounded photo; a tinted placeholder until the slot has a file in photos.ts. Size it with an aspect-* class. */
export function Photo({ slot, alt, className, sizes = "(min-width: 860px) 50vw, 100vw", priority }: Props) {
  const src = PHOTOS[slot];
  return (
    <div className={cn("photo", !src && "photo-ph", className)}>
      {src ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} /> : <Icon name="user" size={36} />}
    </div>
  );
}
```

- [ ] **Step 6: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/ui src/lib/status-param.ts src/lib/status-param.test.ts src/features/site/photos.ts src/features/site/photos.test.ts src/features/site/Photo.tsx
git commit -m "feat(ui): add card, avatar, empty state, photo slots and status param helper

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Visual foundation (tokens, font, component classes)

After this task every page renders with the new skin and old markup. Sections built from deleted classes (`.cells`, `.door-split`, `.steps`) look plain until Tasks 4–5 rebuild them; that is expected.

**Files:**
- Modify: `src/styles/tokens.css` (full rewrite)
- Modify: `src/styles/components.css` (full rewrite)
- Modify: `src/app/[locale]/layout.tsx` (font)
- Modify: `src/features/site/Brand.tsx`; delete `public/logo/iprince-mark-light.png`, `public/logo/iprince-wordmark-light.png`
- Delete: `src/ui/Blueprint.tsx`
- Modify (Blueprint → Card, `kicker kicker-rule` → `eyebrow`): `src/app/[locale]/admin/(auth)/layout.tsx`, `src/app/[locale]/(site)/apply/[slug]/page.tsx`, `src/app/[locale]/(site)/contact/page.tsx`, `src/app/[locale]/(site)/page.tsx`, `src/app/[locale]/(site)/employers/page.tsx`
- Modify: `src/app/[locale]/(site)/layout.tsx` (drop `door-candidate`)

**Interfaces:**
- Consumes: `Card` from Task 1.
- Produces (classes later tasks use): `eyebrow lead muted i i-sm i-lg i-xl icon-chip icon-chip-navy icon-chip-lg card card-flush card-head card-title card-body btn btn-primary btn-ghost btn-danger btn-sm btn-lg btn-icon btn-block tag tag-gold badge status status-* notice notice-* field label req opt hint error-msg input select textarea input-dense check radio section section-tint section-head photo photo-ph float-badge stat stat-value stat-label benefit-list timeline timeline-dot cta-banner site-header site-header-inner brand brand-mark brand-word site-nav header-end header-cta menu-btn lang-switch sheet sheet-head sheet-nav drawer site-footer footer-cols footer-col footer-legal wa-fab wa-label chat-consent admin admin-side side-panel side-group side-group-label side-link user-card user-card-name user-card-role admin-topbar admin-main admin-page-head admin-back tabs tab table-wrap data-table row-link cell-primary cell-sub name-cell avatar empty-state kv kv-wide file-chips file-chip builder-row builder-row-main skip-link`. Tailwind utilities from tokens: `bg-canvas`, `shadow-card`, `shadow-raised`, `rounded-sm|md|lg|full`, `text-gold-600`, `bg-accent-100/60`.

- [ ] **Step 1: Rewrite `src/styles/tokens.css`**

```css
/* iPrince design tokens.
   Palette and scales live in @theme, so Tailwind generates utilities for them.
   Semantic aliases live on :root (remapped inside .cta-banner); @theme inline exposes them as utilities. */

@theme {
  --color-*: initial;
  --color-paper: #ffffff;
  --color-white: #ffffff;
  --color-canvas: #f6f7f9;
  --color-ink: #1d1f20;

  --color-neutral-100: #f5f5f8;
  --color-neutral-200: #e7e7ea;
  --color-neutral-300: #d4d4d7;
  --color-neutral-400: #b7b7ba;
  --color-neutral-500: #98989b;
  --color-neutral-600: #7a7a7d;
  --color-neutral-700: #5d5d60;
  --color-neutral-800: #424244;
  --color-neutral-900: #2b2b2d;

  --color-accent-100: #eef2f8;
  --color-accent-200: #d9e1ee;
  --color-accent-300: #b3c3dc;
  --color-accent-400: #8399bd;
  --color-accent-500: #56709b;
  --color-accent-600: #36527d;
  --color-accent-700: #213d66;
  --color-accent-800: #162c4f;
  --color-accent-900: #0e1f3a;

  /* Gold is a highlight only. Use gold-700 or darker for text on white. */
  --color-gold-100: #fbf5e8;
  --color-gold-200: #f3e3c0;
  --color-gold-300: #e7cb8f;
  --color-gold-400: #d9b366;
  --color-gold-500: #c69a48;
  --color-gold-600: #a98033;
  --color-gold-700: #86642a;
  --color-gold-800: #654b20;
  --color-gold-900: #453416;

  /* Functional only. Always paired with an icon and text. */
  --color-success-100: #e5f3ea;
  --color-success-600: #3d8158;
  --color-success-700: #2c6644;
  --color-warning-100: #faf0db;
  --color-warning-600: #a0741c;
  --color-warning-700: #7a5510;
  --color-danger-100: #fbe8e6;
  --color-danger-600: #c0463b;
  --color-danger-700: #a3342b;

  --text-*: initial;
  --text-2xs: 11px;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;
  --text-3xl: clamp(30px, 4vw, 40px);
  --text-4xl: clamp(40px, 6vw, 60px);

  --leading-tight: 1.1;
  --leading-heading: 1.2;
  --leading-body: 1.6;
  --tracking-heading: -0.02em;

  --spacing: 4px;

  --radius-*: initial;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 9999px;

  --shadow-*: initial;
  --shadow-card: 0 1px 2px rgb(16 24 40 / 0.04), 0 4px 16px rgb(16 24 40 / 0.06);
  --shadow-raised: 0 8px 28px rgb(16 24 40 / 0.12);

  --breakpoint-*: initial;
  --breakpoint-sm: 720px;
  --breakpoint-md: 860px;
  --breakpoint-lg: 960px;
  --breakpoint-xl: 1000px;

  --container-page: 1200px;
  --container-form: 760px;

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}

@theme inline {
  --font-sans: var(--font-body);
  --font-display: var(--font-heading);

  --color-surface: var(--surface-page);
  --color-surface-input: var(--surface-input);
  --color-surface-tint: var(--surface-tint);
  --color-surface-hover: var(--surface-hover);
  --color-surface-pressed: var(--surface-pressed);
  --color-surface-inverse: var(--surface-inverse);

  --color-fg: var(--text-body);
  --color-fg-muted: var(--text-muted);
  --color-fg-accent: var(--text-accent);
  --color-fg-highlight: var(--text-highlight);
  --color-fg-inverse: var(--text-inverse);
  --color-fg-inverse-muted: var(--text-inverse-muted);
  --color-link: var(--text-link);
  --color-link-hover: var(--text-link-hover);
  --color-on-primary: var(--text-on-primary);

  --color-hairline: var(--border-hairline);
  --color-control: var(--border-control);
  --color-control-hover: var(--border-control-hover);
  --color-focus: var(--border-focus);

  --color-action: var(--action-primary);
  --color-action-hover: var(--action-primary-hover);
  --color-action-active: var(--action-primary-active);

  --color-error: var(--status-error-text);
  --color-error-soft: var(--status-error-bg);
  --color-success: var(--status-success-text);
  --color-success-soft: var(--status-success-bg);
  --color-warning: var(--status-warning-text);
  --color-warning-soft: var(--status-warning-bg);
}

:root {
  /* --font-dm-sans comes from next/font in the locale layout. */
  --font-heading: var(--font-dm-sans), system-ui, sans-serif;
  --font-body: var(--font-dm-sans), system-ui, sans-serif;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-heading: 700;

  --surface-page: var(--color-paper);
  --surface-input: var(--color-white);
  --surface-tint: var(--color-accent-100);
  --surface-hover: color-mix(in srgb, var(--color-ink) 5%, transparent);
  --surface-pressed: color-mix(in srgb, var(--color-ink) 10%, transparent);
  --surface-inverse: var(--color-accent-900);

  --text-body: var(--color-ink);
  --text-muted: var(--color-neutral-700);
  --text-accent: var(--color-accent-700);
  --text-highlight: var(--color-gold-700);
  --text-link: var(--color-accent-700);
  --text-link-hover: var(--color-accent-800);
  --text-inverse: var(--color-paper);
  --text-inverse-muted: var(--color-accent-200);
  --text-on-primary: var(--color-paper);

  --border-hairline: color-mix(in srgb, var(--color-ink) 10%, transparent);
  /* Input borders keep 3:1 contrast against white (WCAG 1.4.11). */
  --border-control: var(--color-neutral-600);
  --border-control-hover: var(--color-neutral-800);
  --border-focus: var(--color-accent-600);

  --action-primary: var(--color-accent-700);
  --action-primary-hover: var(--color-accent-800);
  --action-primary-active: var(--color-accent-900);

  --status-error-text: var(--color-danger-700);
  --status-error-bg: var(--color-danger-100);
  --status-success-text: var(--color-success-700);
  --status-success-bg: var(--color-success-100);
  --status-warning-text: var(--color-warning-700);
  --status-warning-bg: var(--color-warning-100);

  --tap-min: 44px;
  --control-h: 48px;
  --control-h-dense: 36px;
  --gutter: clamp(16px, 4vw, 40px);
  --admin-pad: clamp(16px, 3vw, 32px);
  --header-h: 72px;

  --z-header: 50;
  --z-fab: 60;
  --z-dialog: 100;

  --dur-fast: 120ms;
  --dur-base: 200ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-fast: 0ms;
    --dur-base: 0ms;
  }
}

@utility container-page {
  width: 100%;
  max-width: var(--container-page);
  margin-inline: auto;
  padding-inline: var(--gutter);
}

@utility container-form {
  width: 100%;
  max-width: var(--container-form);
  margin-inline: auto;
  padding-inline: var(--gutter);
}
```

- [ ] **Step 2: Rewrite `src/styles/components.css`**

```css
/* iPrince component classes. React primitives in src/ui render this markup; page layout uses Tailwind utilities.
   Shapes: cards radius-md, inputs radius-sm, buttons, pills and tags radius-full. */

@layer components {
  .skip-link { position: absolute; left: 8px; top: -60px; z-index: 200; padding: 10px 16px; border-radius: var(--radius-full); background: var(--action-primary); color: var(--text-on-primary); }
  .skip-link:focus { top: 8px; }

  .eyebrow { font-size: var(--text-sm); font-weight: var(--weight-medium); line-height: 1.4; color: var(--color-accent-600); }
  .lead { font-size: var(--text-lg); color: var(--text-muted); max-width: 60ch; }
  .muted { color: var(--text-muted); }

  /* Icon: Lucide (stroke 1.5) as a CSS mask, so it takes currentColor (src/ui/Icon.tsx). */
  .i {
    display: inline-block; flex: none; width: 20px; height: 20px; background: currentColor;
    -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
    -webkit-mask-position: center; mask-position: center; vertical-align: middle;
  }
  .i-sm { width: 16px; height: 16px; }
  .i-lg { width: 28px; height: 28px; }
  .i-xl { width: 36px; height: 36px; }

  .icon-chip { display: inline-grid; place-items: center; flex: none; width: 44px; height: 44px; border-radius: var(--radius-sm); background: var(--color-gold-100); color: var(--color-gold-700); }
  .icon-chip-navy { background: var(--color-accent-100); color: var(--color-accent-700); }
  .icon-chip-lg { width: 56px; height: 56px; border-radius: var(--radius-md); }

  /* Cards */
  .card { display: flex; flex-direction: column; gap: 12px; min-width: 0; padding: 24px; background: var(--surface-input); border-radius: var(--radius-md); box-shadow: var(--shadow-card); }
  .card-flush { padding: 0; gap: 0; overflow: hidden; }
  .card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
  .card-title { font-size: var(--text-xl); font-weight: var(--weight-heading); line-height: 1.25; letter-spacing: var(--tracking-heading); }
  .card-body { flex: 1; font-size: var(--text-sm); color: var(--text-muted); }
  a.card { color: inherit; text-decoration: none; transition: box-shadow var(--dur-base) var(--ease-standard), transform var(--dur-base) var(--ease-standard); }
  a.card:hover { color: inherit; box-shadow: var(--shadow-raised); transform: translateY(-2px); }

  /* Photos */
  .photo { position: relative; display: grid; place-items: center; overflow: hidden; border-radius: var(--radius-lg); background: var(--color-accent-100); }
  .photo img { object-fit: cover; }
  .photo-ph { color: var(--color-accent-400); background: linear-gradient(135deg, var(--color-accent-100), var(--color-gold-100)); }
  .float-badge { position: absolute; z-index: 1; display: none; align-items: center; gap: 10px; max-width: 250px; padding: 10px 18px 10px 10px; border-radius: var(--radius-full); background: var(--surface-input); box-shadow: var(--shadow-raised); font-size: var(--text-sm); line-height: 1.3; color: var(--text-muted); }
  .float-badge .icon-chip { width: 36px; height: 36px; border-radius: 50%; }
  .float-badge strong { display: block; font-weight: var(--weight-semibold); color: var(--text-body); }
  @media (min-width: 720px) { .float-badge { display: flex; } }

  /* Buttons: navy outline by default, navy fill as primary. */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: var(--tap-min); padding: 10px 22px; cursor: pointer; text-decoration: none; text-align: center;
    font-family: var(--font-body); font-weight: var(--weight-medium); font-size: 15px; line-height: 1.2;
    color: var(--text-accent); background: transparent; border: 1.5px solid currentColor; border-radius: var(--radius-full);
    transition: background var(--dur-fast), color var(--dur-fast), border-color var(--dur-fast), box-shadow var(--dur-fast);
  }
  .btn, .wa-fab, .tag, .badge, .status, .tab, .site-nav a { hyphens: manual; }
  .btn:hover { background: var(--surface-tint); color: var(--text-accent); }
  .btn:active { background: var(--surface-pressed); }
  .btn:disabled, .btn[aria-disabled="true"] { opacity: 0.45; cursor: not-allowed; }
  .btn-primary { background: var(--action-primary); border-color: var(--action-primary); color: var(--text-on-primary); }
  .btn-primary:hover { background: var(--action-primary-hover); border-color: var(--action-primary-hover); color: var(--text-on-primary); box-shadow: var(--shadow-card); }
  .btn-primary:active { background: var(--action-primary-active); }
  .btn-ghost { border-color: transparent; color: var(--text-link); padding-inline: 12px; }
  .btn-ghost:hover { color: var(--text-link-hover); background: var(--surface-tint); }
  .btn-danger { border-color: transparent; color: var(--status-error-text); }
  .btn-danger:hover { background: var(--status-error-bg); color: var(--status-error-text); }
  .btn-sm { min-height: var(--control-h-dense); padding: 6px 14px; font-size: 14px; gap: 6px; }
  .btn-lg { min-height: 52px; padding: 14px 28px; font-size: 16px; }
  .btn-icon { width: var(--tap-min); padding: 0; }
  .btn-sm.btn-icon { width: var(--control-h-dense); }
  .btn-block { width: 100%; }

  /* Tags, badges, status */
  .tag { display: inline-flex; align-items: center; gap: 6px; min-height: 26px; padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: var(--weight-medium); line-height: 1.3; background: var(--color-accent-100); color: var(--color-accent-800); }
  .tag-gold { background: var(--color-gold-100); color: var(--color-gold-800); }
  .badge { display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding: 0 7px; border-radius: var(--radius-full); font-size: var(--text-2xs); font-weight: var(--weight-semibold); font-variant-numeric: tabular-nums; background: var(--color-gold-200); color: var(--color-gold-900); }
  .status { display: inline-flex; align-items: center; gap: 6px; min-height: 24px; padding: 3px 10px 3px 8px; border-radius: var(--radius-full); white-space: nowrap; font-size: var(--text-xs); font-weight: var(--weight-medium); background: var(--color-neutral-200); color: var(--color-neutral-900); }
  .status::before { content: ""; flex: none; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .status-new { background: var(--color-accent-100); color: var(--color-accent-800); }
  .status-review { background: var(--status-warning-bg); color: var(--status-warning-text); }
  .status-ok { background: var(--status-success-bg); color: var(--status-success-text); }
  .status-error { background: var(--status-error-bg); color: var(--status-error-text); }
  .status-draft { background: var(--color-neutral-200); color: var(--color-neutral-800); }
  .status-draft::before { background: transparent; border: 1.5px solid currentColor; }

  /* Notices */
  .notice { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: var(--radius-md); font-size: var(--text-sm); background: var(--surface-tint); }
  .notice-title { font-weight: var(--weight-semibold); }
  .notice-info .i { color: var(--text-accent); }
  .notice-error { background: var(--status-error-bg); color: var(--status-error-text); }
  .notice-success { background: var(--status-success-bg); color: var(--status-success-text); }

  /* Forms */
  .field { display: grid; gap: 6px; min-width: 0; align-content: start; }
  .label { font-size: var(--text-sm); font-weight: var(--weight-semibold); line-height: 1.35; }
  .label .req { color: var(--status-error-text); margin-left: 2px; }
  .label .opt { font-weight: var(--weight-regular); color: var(--text-muted); margin-left: 4px; }
  .hint { font-size: 13px; color: var(--text-muted); line-height: 1.4; }
  .error-msg { display: flex; gap: 6px; align-items: flex-start; font-size: 13px; line-height: 1.4; color: var(--status-error-text); font-weight: var(--weight-medium); }
  .input, .select, .textarea {
    width: 100%; min-height: var(--control-h); padding: 11px 14px; font: inherit; font-size: var(--text-base); line-height: 1.4;
    color: var(--text-body); caret-color: var(--text-accent); background: var(--surface-input);
    border: 1px solid var(--border-control); border-radius: var(--radius-sm); transition: border-color var(--dur-fast), box-shadow var(--dur-fast);
  }
  .input::placeholder, .textarea::placeholder { color: var(--color-neutral-600); }
  .input:hover, .select:hover, .textarea:hover { border-color: var(--border-control-hover); }
  .input:focus-visible, .select:focus-visible, .textarea:focus-visible { outline: none; border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--color-accent-200); }
  .input[aria-invalid="true"], .select[aria-invalid="true"], .textarea[aria-invalid="true"] { border-color: var(--status-error-text); box-shadow: 0 0 0 1px var(--status-error-text); }
  .textarea { min-height: 120px; resize: vertical; }
  .select {
    appearance: none; padding-right: 40px; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23424244' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
  }
  .input-dense, .select.input-dense { min-height: var(--control-h-dense); padding-block: 5px; font-size: var(--text-sm); }
  .check, .radio { display: flex; gap: 12px; align-items: flex-start; cursor: pointer; font-size: var(--text-base); line-height: 1.45; min-height: var(--tap-min); padding-block: 10px; }
  .check input, .radio input { appearance: none; flex: none; width: 22px; height: 22px; margin: 0; cursor: pointer; border: 1.5px solid var(--border-control); border-radius: 6px; background: var(--surface-input); }
  .radio input { border-radius: 50%; }
  .check input:hover, .radio input:hover { border-color: var(--border-control-hover); }
  .check input:checked {
    background: var(--action-primary) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E") center/16px no-repeat;
    border-color: var(--action-primary);
  }
  .radio input:checked { border-color: var(--action-primary); background: var(--action-primary); box-shadow: inset 0 0 0 4px var(--surface-input); }
  .check input[aria-invalid="true"] { border-color: var(--status-error-text); }

  /* Marketing */
  .section { padding-block: clamp(64px, 9vw, 120px); }
  .section-tint { background: color-mix(in srgb, var(--color-accent-100) 60%, var(--color-paper)); }
  .section-head { display: grid; gap: 12px; max-width: 680px; margin-bottom: clamp(32px, 4vw, 48px); }
  .stat { flex-direction: row; align-items: center; gap: 16px; }
  .stat-value { display: block; font-size: 30px; font-weight: var(--weight-heading); line-height: 1.1; letter-spacing: var(--tracking-heading); font-variant-numeric: tabular-nums; color: var(--text-body); }
  .stat-label { display: block; font-size: var(--text-sm); color: var(--text-muted); }
  .benefit-list { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
  .benefit-list li { display: flex; gap: 12px; align-items: flex-start; }
  .benefit-list .i { margin-top: 2px; color: var(--color-gold-600); }
  .timeline { position: relative; display: grid; gap: 36px; margin: 0; padding: 0 0 0 64px; list-style: none; }
  .timeline::before { content: ""; position: absolute; left: 21px; top: 22px; bottom: 22px; width: 2px; background: var(--color-gold-200); }
  .timeline > li { position: relative; display: grid; gap: 8px; }
  .timeline-dot { position: absolute; left: -64px; top: -6px; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--color-gold-400); color: var(--color-accent-900); font-weight: var(--weight-heading); box-shadow: 0 0 0 6px var(--surface-page); }

  /* Dark call-to-action banner: the only inverse surface on the public site. */
  .cta-banner {
    --surface-tint: color-mix(in srgb, var(--color-paper) 12%, transparent);
    --surface-pressed: color-mix(in srgb, var(--color-paper) 18%, transparent);
    --surface-page: var(--color-accent-900);
    --text-body: var(--color-paper);
    --text-muted: var(--color-accent-200);
    --text-accent: var(--color-paper);
    --text-link: var(--color-gold-300);
    --border-focus: var(--color-gold-300);
    --action-primary: var(--color-gold-400);
    --action-primary-hover: var(--color-gold-300);
    --action-primary-active: var(--color-gold-500);
    --text-on-primary: var(--color-accent-900);
    position: relative; isolation: isolate; overflow: hidden; display: grid; justify-items: start; gap: 20px;
    padding: clamp(32px, 6vw, 72px); border-radius: var(--radius-lg); background: var(--surface-page); color: var(--text-body);
  }
  .cta-banner > .photo { position: absolute; inset: 0; z-index: -1; border-radius: 0; opacity: 0.25; }
  .cta-banner .eyebrow { color: var(--color-gold-300); }

  /* Site chrome */
  .site-header { position: sticky; top: 0; z-index: var(--z-header); background: var(--surface-page); transition: box-shadow var(--dur-base); }
  .site-header[data-scrolled] { box-shadow: var(--shadow-card); }
  .site-header-inner { display: flex; align-items: center; gap: 16px; min-height: var(--header-h); }
  .brand { display: inline-flex; align-items: center; gap: 10px; min-width: 0; color: var(--text-body); text-decoration: none; }
  .brand:hover { color: var(--text-body); }
  .brand-mark { height: 40px; width: auto; flex: none; }
  .brand-word { height: 30px; width: auto; min-width: 0; }
  @media (max-width: 420px) { .brand-word { height: 22px; } .brand-mark { height: 32px; } }
  .site-nav { display: none; flex: 1; justify-content: center; gap: 4px; }
  .site-nav a { display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border-radius: var(--radius-full); color: var(--text-body); text-decoration: none; font-size: 15px; font-weight: var(--weight-medium); }
  .site-nav a:hover { background: var(--surface-tint); color: var(--text-accent); }
  .header-end { display: flex; align-items: center; gap: 12px; margin-left: auto; }
  .header-cta { display: none; }
  @media (min-width: 960px) {
    .site-nav { display: flex; }
    .header-cta { display: inline-flex; }
    .menu-btn { display: none; }
    .header-end { margin-left: 0; }
  }
  .lang-switch { display: inline-flex; padding: 3px; border-radius: var(--radius-full); background: var(--color-canvas); }
  .lang-switch a { display: grid; place-items: center; min-width: 36px; min-height: 30px; padding: 0 8px; border-radius: var(--radius-full); font-size: 13px; font-weight: var(--weight-semibold); color: var(--text-muted); text-decoration: none; }
  .lang-switch [aria-current="true"] { background: var(--surface-input); color: var(--text-accent); box-shadow: var(--shadow-card); }
  .lang-switch a:not([aria-current="true"]):hover { color: var(--text-body); }

  /* Modal sheets: site menu (top) and admin drawer (left). Native <dialog> with showModal(). */
  .sheet, .drawer { margin: 0; max-width: none; padding: 0; border: 0; color: var(--text-body); background: var(--surface-input); box-shadow: var(--shadow-raised); }
  .sheet::backdrop, .drawer::backdrop { background: rgb(16 24 40 / 0.4); }
  .sheet { width: 100%; max-height: 100dvh; padding: 8px var(--gutter) 24px; border-radius: 0 0 var(--radius-lg) var(--radius-lg); }
  .sheet-head { display: flex; justify-content: flex-end; min-height: 56px; align-items: center; }
  .sheet-nav { display: grid; gap: 4px; padding-block: 4px 20px; }
  .sheet-nav a { display: flex; align-items: center; min-height: 48px; padding: 0 12px; border-radius: var(--radius-sm); color: var(--text-body); text-decoration: none; font-size: var(--text-lg); font-weight: var(--weight-medium); }
  .sheet-nav a:hover { background: var(--surface-tint); }
  .drawer { width: min(300px, 85vw); height: 100dvh; max-height: none; }

  .site-footer { background: var(--color-canvas); color: var(--text-body); padding-block: 64px 28px; font-size: var(--text-sm); }
  .site-footer a { color: var(--text-muted); text-decoration: none; }
  .site-footer a:hover { color: var(--text-accent); text-decoration: underline; }
  .footer-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 32px; }
  .footer-col { display: grid; gap: 10px; align-content: start; }
  .footer-col h4 { font-size: 15px; margin-bottom: 4px; }
  .footer-legal { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px 24px; margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--border-hairline); font-size: 13px; color: var(--text-muted); }
  .footer-legal nav { display: flex; flex-wrap: wrap; gap: 6px 20px; }

  .wa-fab { position: fixed; right: 16px; bottom: 16px; z-index: var(--z-fab); display: inline-flex; align-items: center; gap: 10px; min-height: 52px; padding: 0 16px; border: 0; border-radius: var(--radius-full); background: var(--action-primary); color: var(--text-on-primary); text-decoration: none; font-weight: var(--weight-medium); font-size: 15px; box-shadow: var(--shadow-raised); white-space: nowrap; }
  .wa-fab:hover { background: var(--action-primary-hover); color: var(--text-on-primary); }
  .wa-fab .wa-label { display: none; }
  @media (min-width: 720px) { .wa-fab { right: 24px; bottom: 24px; padding: 0 20px; } .wa-fab .wa-label { display: inline; } }
  /* Chat consent panel: sits above the chat button until the visitor enables tawk.to. */
  .chat-consent { position: fixed; right: 16px; bottom: 80px; z-index: var(--z-fab); display: grid; gap: 12px; width: min(340px, calc(100vw - 32px)); padding: 20px; border-radius: var(--radius-md); background: var(--surface-input); color: var(--text-body); box-shadow: var(--shadow-raised); font-size: var(--text-sm); }
  @media (min-width: 720px) { .chat-consent { right: 24px; bottom: 88px; } }

  /* Admin shell */
  .admin { display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; min-height: 100vh; background: var(--color-canvas); font-size: var(--text-sm); }
  @media (min-width: 1000px) { .admin { grid-template-columns: 248px minmax(0, 1fr); } }
  .admin-side { display: none; }
  @media (min-width: 1000px) { .admin-side { position: sticky; top: 0; display: flex; height: 100vh; overflow-y: auto; background: var(--surface-input); border-right: 1px solid var(--border-hairline); } }
  .side-panel { display: flex; flex-direction: column; gap: 24px; width: 100%; min-height: 100%; padding: 20px 14px; }
  .side-group { display: grid; gap: 2px; }
  .side-group-label { padding: 0 12px 6px; font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--text-muted); }
  .side-link { display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 0 12px; border-radius: var(--radius-full); color: var(--text-body); text-decoration: none; font-size: var(--text-sm); font-weight: var(--weight-medium); }
  .side-link .i { width: 18px; height: 18px; color: var(--text-muted); }
  .side-link:hover { background: var(--color-canvas); color: var(--text-body); }
  .side-link[aria-current="page"] { background: var(--color-accent-100); color: var(--color-accent-800); }
  .side-link[aria-current="page"] .i { color: var(--color-accent-700); }
  .side-link .badge { margin-left: auto; }
  .user-card { display: flex; align-items: center; gap: 10px; margin-top: auto; padding: 12px; border-radius: var(--radius-md); background: var(--color-canvas); }
  .user-card-name { font-weight: var(--weight-semibold); line-height: 1.3; }
  .user-card-role { font-size: var(--text-xs); color: var(--text-muted); }
  .admin-topbar { position: sticky; top: 0; z-index: var(--z-header); display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 0 var(--admin-pad); background: var(--surface-input); border-bottom: 1px solid var(--border-hairline); }
  @media (min-width: 1000px) { .admin-topbar { display: none; } }
  .admin-main { display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 24px; min-width: 0; padding: 0 var(--admin-pad) 48px; }
  .admin-page-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 16px; margin-inline: calc(-1 * var(--admin-pad)); padding: 20px var(--admin-pad); background: var(--surface-input); border-bottom: 1px solid var(--border-hairline); }
  .admin-page-head h1 { font-size: var(--text-2xl); }
  .admin-back { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-sm); color: var(--text-muted); text-decoration: none; }
  .admin-back:hover { color: var(--text-accent); }

  .tabs { display: flex; gap: 4px; padding: 12px 16px; overflow-x: auto; border-bottom: 1px solid var(--border-hairline); }
  .tab { display: inline-flex; align-items: center; min-height: 34px; padding: 0 14px; border-radius: var(--radius-full); color: var(--text-muted); text-decoration: none; font-size: var(--text-sm); font-weight: var(--weight-medium); white-space: nowrap; }
  .tab:hover { background: var(--color-canvas); color: var(--text-body); }
  .tab[aria-current="page"] { background: var(--color-accent-700); color: var(--color-paper); }

  .table-wrap { overflow-x: auto; }
  .data-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
  .data-table th { text-align: left; white-space: nowrap; font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--text-muted); padding: 12px 16px; border-bottom: 1px solid var(--border-hairline); background: var(--color-canvas); }
  .data-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-hairline); vertical-align: middle; }
  .data-table tbody tr:last-child td { border-bottom: 0; }
  .data-table tbody tr:hover { background: var(--color-canvas); }
  .data-table .num { text-align: right; font-variant-numeric: tabular-nums; }
  .data-table .actions { width: 1%; text-align: right; white-space: nowrap; }
  .data-table .nowrap { white-space: nowrap; }
  /* Whole-row click target: the row's .row-link stretches over the row; other controls in the row sit above it. */
  .data-table tbody tr:has(.row-link) { position: relative; cursor: pointer; }
  .row-link { font-weight: var(--weight-semibold); color: var(--text-body); text-decoration: none; }
  .row-link::after { content: ""; position: absolute; inset: 0; }
  .row-link:hover { text-decoration: underline; }
  .row-link:focus-visible { outline: none; }
  .data-table tbody tr:has(.row-link:focus-visible), li:has(> div > .row-link:focus-visible) { outline: 2px solid var(--border-focus); outline-offset: -2px; }
  .data-table td :is(a:not(.row-link), button, form) { position: relative; z-index: 1; }
  .cell-primary { font-weight: var(--weight-semibold); }
  .cell-sub { font-size: var(--text-xs); color: var(--text-muted); }
  .name-cell { display: flex; align-items: center; gap: 12px; }
  .avatar { display: inline-grid; place-items: center; flex: none; width: 36px; height: 36px; border-radius: 50%; background: var(--color-accent-100); color: var(--color-accent-800); font-size: var(--text-xs); font-weight: var(--weight-semibold); }
  .empty-state { display: grid; justify-items: center; gap: 12px; padding: 48px 24px; text-align: center; color: var(--text-muted); }

  .kv { display: grid; grid-template-columns: minmax(0, 1fr); column-gap: 24px; margin: 0; }
  .kv > div { display: grid; gap: 2px; padding-block: 10px; border-bottom: 1px solid var(--border-hairline); }
  .kv dt { font-size: var(--text-xs); color: var(--text-muted); }
  .kv dd { margin: 0; font-weight: var(--weight-medium); white-space: pre-wrap; }
  @media (min-width: 720px) { .kv { grid-template-columns: repeat(2, minmax(0, 1fr)); } .kv > .kv-wide { grid-column: span 2; } }
  .file-chips { display: flex; flex-wrap: wrap; gap: 12px; margin: 0; padding: 0; list-style: none; }
  .file-chip { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 6px 14px 6px 10px; border-radius: var(--radius-full); background: var(--color-canvas); color: var(--text-body); text-decoration: none; font-size: var(--text-sm); }
  a.file-chip:hover { background: var(--color-accent-100); color: var(--color-accent-800); }

  .builder-row { display: flex; align-items: center; gap: 8px; padding: 6px 6px 6px 10px; border: 1px solid var(--border-hairline); border-radius: var(--radius-sm); background: var(--surface-input); }
  .builder-row:hover { border-color: var(--border-control); }
  .builder-row[data-selected] { border-color: var(--color-accent-600); background: var(--color-accent-100); }
  .builder-row-main { display: flex; flex: 1; min-width: 0; align-items: center; gap: 8px; min-height: 36px; padding: 0 4px; border: 0; background: none; cursor: pointer; text-align: left; font: inherit; color: inherit; }
}
```

- [ ] **Step 3: Switch the font in `src/app/[locale]/layout.tsx`**

Replace the `Barlow, Barlow_Condensed` import and both font constants with:
```tsx
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
});
```
and the `<html>` element with:
```tsx
<html lang={locale} className={dmSans.variable}>
```

- [ ] **Step 4: Simplify `src/features/site/Brand.tsx` (all logo backgrounds are light now)**

```tsx
import Image from "next/image";

/** Logo mark + wordmark (dark variant; every surface that shows the logo is light). */
export function BrandLogo() {
  return (
    <>
      <Image src="/logo/iprince-mark.png" alt="" width={556} height={478} className="brand-mark" priority />
      <Image src="/logo/iprince-wordmark.png" alt="" width={729} height={248} className="brand-word" priority />
    </>
  );
}
```
Then: `git rm public/logo/iprince-mark-light.png public/logo/iprince-wordmark-light.png`

- [ ] **Step 5: Replace `Blueprint` with `Card` and the kicker classes**

```bash
git rm src/ui/Blueprint.tsx
grep -rl 'Blueprint\|kicker kicker-rule\|door-candidate' src/app | while read -r f; do
  sed -i '' -e 's#import { Blueprint } from "@/ui/Blueprint";#import { Card } from "@/ui/Card";#' \
            -e 's#<Blueprint#<Card#g; s#</Blueprint>#</Card>#g' \
            -e 's#kicker kicker-rule#eyebrow#g' \
            -e 's#door-candidate ##' "$f"
done
grep -rn 'Blueprint\|kicker\|door-candidate\|"panel ' src || echo clean
```
Expected: `clean` except the line in `src/app/[locale]/admin/(auth)/layout.tsx` with `className="panel bg-surface-input p-8"`; change that `Card` className to `"p-8 shadow-raised"`. (Home and employers still reference `stat`, `cells`, `door-*`; Tasks 4–5 rewrite those pages.)

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all pass.

Run: `npm run test:e2e`
Expected: all existing specs pass (markup and accessible names unchanged).

Then `npm run dev` and look at `/en`, `/en/apply/pflege`, `/en/admin/login`, `/en/admin/applications` at 375px and 1280px: DM Sans, pill buttons, rounded inputs, white cards. Nothing overlaps or overflows horizontally.

- [ ] **Step 7: Commit**

```bash
git add -A src public/logo
git commit -m "feat(ui): rounded DM Sans design tokens and component classes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Public chrome (header, mobile menu, footer)

**Files:**
- Create: `src/features/site/HeaderShadow.tsx`, `src/features/site/MobileNav.tsx`, `src/i18n/messages.test.ts`, `e2e/layout.spec.ts`
- Modify: `src/features/site/SiteHeader.tsx`, `src/features/site/SiteFooter.tsx:18`, `src/i18n/messages/en.json`, `src/i18n/messages/de.json`

**Interfaces:**
- Produces: `MobileNav({ links: { href: string; label: string }[], cta: { href: string; label: string }, openLabel: string, closeLabel: string, navLabel: string })`; message keys `site.navContact`, `site.menuOpen`, `site.menuClose`.

- [ ] **Step 1: Write the failing message-parity test**

`src/i18n/messages.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import de from "./messages/de.json";
import en from "./messages/en.json";

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("messages", () => {
  it("German and English define the same keys", () => {
    expect(keys(de).sort()).toEqual(keys(en).sort());
  });
});
```
Run: `npx vitest run src/i18n/messages.test.ts`
Expected: PASS today (it guards later edits). If `resolveJsonModule` errors, check `tsconfig.json` has it (Next sets it by default).

- [ ] **Step 2: Write the failing e2e test**

`e2e/layout.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test.describe("phone width", () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test("the site menu lists the pages and closes with Escape", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("link", { name: "Employers" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("following a menu link navigates and closes the menu", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/en\/contact$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("an in-page menu link closes the menu", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "How it works" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
```
Run: `npx playwright test e2e/layout.spec.ts`
Expected: FAIL, no button "Open menu".

- [ ] **Step 3: Add the messages**

In `en.json`, inside `"site"`, after `"navEmployers": "Employers",` add:
```json
    "navContact": "Contact",
    "menuOpen": "Open menu",
    "menuClose": "Close menu",
```
In `de.json`, inside `"site"`, after `"navEmployers": "Arbeitgeber",` add:
```json
    "navContact": "Kontakt",
    "menuOpen": "Menü öffnen",
    "menuClose": "Menü schließen",
```
(Match the surrounding layout; keep valid JSON commas.)

- [ ] **Step 4: Implement `HeaderShadow` and `MobileNav`**

`src/features/site/HeaderShadow.tsx`:
```tsx
"use client";

import { useEffect } from "react";

/** Marks the sticky site header once the page has scrolled, so CSS can add a shadow. */
export function HeaderShadow() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    const update = () => header.toggleAttribute("data-scrolled", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return null;
}
```

`src/features/site/MobileNav.tsx`:
```tsx
"use client";

import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/ui/Icon";

type NavLink = { href: string; label: string };
type Props = { links: NavLink[]; cta: NavLink; openLabel: string; closeLabel: string; navLabel: string };

/** Menu button + top sheet below 960px. Closes on Escape (native), on the backdrop and on any link. */
export function MobileNav({ links, cta, openLabel, closeLabel, navLabel }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="btn btn-icon menu-btn" aria-label={openLabel} onClick={() => dialog.current?.showModal()}>
        <Icon name="menu" />
      </button>
      <dialog
        ref={dialog}
        className="sheet"
        aria-label={navLabel}
        onClick={(event) => {
          const target = event.target as Element;
          if (target === event.currentTarget || target.closest("a")) event.currentTarget.close();
        }}
      >
        <div className="sheet-head">
          <button type="button" className="btn btn-ghost btn-icon" aria-label={closeLabel} onClick={() => dialog.current?.close()}>
            <Icon name="x" />
          </button>
        </div>
        <nav className="sheet-nav" aria-label={navLabel}>
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <Link href={cta.href} className="btn btn-primary btn-block">{cta.label}</Link>
      </dialog>
    </>
  );
}
```

- [ ] **Step 5: Rewrite `src/features/site/SiteHeader.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "./Brand";
import { HeaderShadow } from "./HeaderShadow";
import { LangSwitch } from "./LangSwitch";
import { MobileNav } from "./MobileNav";

export async function SiteHeader() {
  const t = await getTranslations("site");
  const links = [
    { href: "/#berufe", label: t("navProfessions") },
    { href: "/#ablauf", label: t("navSteps") },
    { href: "/employers", label: t("navEmployers") },
    { href: "/contact", label: t("navContact") },
  ];
  const cta = { href: "/#berufe", label: t("cta") };
  return (
    <header className="site-header">
      <HeaderShadow />
      <div className="site-header-inner container-page">
        <Link href="/" className="brand" aria-label={t("brand")}>
          <BrandLogo />
        </Link>
        <nav className="site-nav" aria-label={t("navLabel")}>
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="header-end">
          <LangSwitch />
          <Link href={cta.href} className="btn btn-primary header-cta">{cta.label}</Link>
          <MobileNav links={links} cta={cta} openLabel={t("menuOpen")} closeLabel={t("menuClose")} navLabel={t("navLabel")} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Footer text colour**

In `src/features/site/SiteFooter.tsx` change `<p className="max-w-[32ch] text-fg-inverse/80">` to `<p className="max-w-[32ch] text-fg-muted">`. The rest of the footer markup stays; `.site-footer` is light now.

- [ ] **Step 7: Verify**

Run: `npx vitest run src/i18n/messages.test.ts && npx playwright test e2e/layout.spec.ts`
Expected: PASS.
Run: `npm run typecheck && npm run lint`
Expected: no errors. At 1280px the header shows logo, centred nav, language pill, "Apply for free"; scrolling adds a shadow.

- [ ] **Step 8: Commit**

```bash
git add src/features/site src/i18n e2e/layout.spec.ts
git commit -m "feat(site): white header with mobile menu sheet and light footer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Home page

**Files:**
- Modify: `src/app/[locale]/(site)/page.tsx` (full rewrite), `src/i18n/messages/en.json`, `src/i18n/messages/de.json`
- Modify: `e2e/layout.spec.ts` (add image test)

**Interfaces:**
- Consumes: `Photo`, `Card`, `Icon`, classes from Task 2.
- Produces: message keys under `home.trust`, `home.features`, `home.heroAlt`, `home.badgeLive`, `home.badgeFreeText`, `home.statFreeValue`, `home.stepsAlt`, `home.doors.contactCta`; removes `home.doors.candidate*`.

- [ ] **Step 1: Write the failing e2e test**

Append to `e2e/layout.spec.ts` (outside the `describe`):
```ts
test("the home page shows its sections and requests no missing images", async ({ page }) => {
  const failed: string[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) failed.push(response.url());
  });
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 2, name: "We find the job that suits your skills" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contact us" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(failed).toEqual([]);
});
```
Run: `npx playwright test e2e/layout.spec.ts -g "home page"`
Expected: FAIL, heading not found.

- [ ] **Step 2: Add the copy**

In `en.json` `"home"`: add after `"lead"`:
```json
    "trust": { "free": "Free for applicants", "advisor": "Personal advisor", "languages": "Advice in German and English" },
    "heroAlt": "Skilled worker starting a new job in Germany",
    "badgeLive": "Available now",
    "badgeFreeText": "No fees, ever",
    "statFreeValue": "€0",
    "features": {
      "match": { "eyebrow": "Matching", "title": "We find the job that suits your skills", "text": "Tell us about your profession and experience. We match you with employers in Germany who are looking for exactly your qualifications.", "alt": "Candidate talking to an employer" },
      "advisors": { "eyebrow": "Personal support", "title": "An advisor accompanies you at every step", "text": "From the recognition of your qualifications to visa and relocation: one contact person guides you until your first working day.", "alt": "Advisor helping a candidate", "badgeTitle": "One contact person", "badgeText": "From application to first day" }
    },
    "stepsAlt": "Candidate filling in the application",
```
In `"doors"` remove the four `candidate*` keys and add `"contactCta": "Contact us"`.

In `de.json` `"home"`: add after `"lead"`:
```json
    "trust": { "free": "Kostenlos für Bewerber", "advisor": "Persönliche Beratung", "languages": "Beratung auf Deutsch und Englisch" },
    "heroAlt": "Fachkraft beim Start in einen neuen Job in Deutschland",
    "badgeLive": "Jetzt verfügbar",
    "badgeFreeText": "Ohne Gebühren",
    "statFreeValue": "0 €",
    "features": {
      "match": { "eyebrow": "Vermittlung", "title": "Wir finden den Job, der zu Ihren Fähigkeiten passt", "text": "Erzählen Sie uns von Ihrem Beruf und Ihrer Erfahrung. Wir bringen Sie mit Arbeitgebern in Deutschland zusammen, die genau Ihre Qualifikation suchen.", "alt": "Bewerberin im Gespräch mit einem Arbeitgeber" },
      "advisors": { "eyebrow": "Persönliche Begleitung", "title": "Eine Ansprechperson begleitet Sie bei jedem Schritt", "text": "Von der Anerkennung Ihrer Qualifikation über das Visum bis zum Umzug: Eine Ansprechperson begleitet Sie bis zu Ihrem ersten Arbeitstag.", "alt": "Beraterin unterstützt einen Bewerber", "badgeTitle": "Eine Ansprechperson", "badgeText": "Von der Bewerbung bis zum ersten Arbeitstag" }
    },
    "stepsAlt": "Bewerber füllt das Formular aus",
```
In `"doors"` remove the four `candidate*` keys and add `"contactCta": "Kontakt aufnehmen"`.

Run: `npx vitest run src/i18n/messages.test.ts`
Expected: PASS.

- [ ] **Step 3: Rewrite `src/app/[locale]/(site)/page.tsx`**

```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { listActiveProfessions } from "@/features/professions/queries";
import { WHATSAPP_URL } from "@/features/site/contact";
import { Photo } from "@/features/site/Photo";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";
import { cn } from "@/ui/cn";

const TRUST = [
  { key: "free", icon: "badge-check" },
  { key: "advisor", icon: "heart-handshake" },
  { key: "languages", icon: "languages" },
] as const;
const FEATURES = [
  { key: "match", slot: "feature-match" },
  { key: "advisors", slot: "feature-advisors" },
] as const;
const STEPS = ["choose", "apply", "contact"] as const;

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tSite, format, professions] = await Promise.all([
    getTranslations("home"),
    getTranslations("site"),
    getFormatter(),
    listActiveProfessions(),
  ]);
  const openPositions = professions.reduce((sum, p) => sum + p.openPositions, 0);
  const stats = [
    { icon: "briefcase", value: format.number(openPositions), label: t("statPositions") },
    { icon: "layout-grid", value: format.number(professions.length), label: t("statProfessions") },
    { icon: "badge-check", value: t("statFreeValue"), label: t("statFree") },
  ];

  return (
    <>
      <section className="pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="container-page grid items-center gap-12 md:grid-cols-2">
          <div className="grid gap-6">
            <p className="eyebrow">{t("kicker")}</p>
            <h1>{t("title")}</h1>
            <p className="lead">{t("lead")}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#berufe" className="btn btn-primary btn-lg">
                {tSite("cta")}
                <Icon name="arrow-right" />
              </a>
              <a href={WHATSAPP_URL} className="btn btn-lg" target="_blank" rel="noopener noreferrer">
                <Icon name="message-circle" />
                {t("ctaWhatsapp")}
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-sm text-fg-muted">
              {TRUST.map(({ key, icon }) => (
                <li key={key} className="inline-flex items-center gap-2">
                  <Icon name={icon} size={16} className="text-gold-600" />
                  {t(`trust.${key}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <Photo slot="hero" alt={t("heroAlt")} className="aspect-[4/5] md:aspect-[5/6]" priority />
            <div className="float-badge -left-4 top-10">
              <span className="icon-chip"><Icon name="briefcase" size={16} /></span>
              <span><strong>{tSite("openPositions", { count: openPositions })}</strong>{t("badgeLive")}</span>
            </div>
            <div className="float-badge -right-4 bottom-10">
              <span className="icon-chip icon-chip-navy"><Icon name="badge-check" size={16} /></span>
              <span><strong>{t("statFree")}</strong>{t("badgeFreeText")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page relative z-10 grid gap-4 sm:grid-cols-3 md:-mt-8">
        {stats.map((s) => (
          <Card key={s.label} className="stat">
            <span className="icon-chip"><Icon name={s.icon} /></span>
            <span>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </span>
          </Card>
        ))}
      </section>

      <section className="section">
        <div className="container-page grid gap-20 md:gap-28">
          {FEATURES.map((f, i) => (
            <div key={f.key} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className={cn("relative", i % 2 === 1 && "md:order-2")}>
                <Photo slot={f.slot} alt={t(`features.${f.key}.alt`)} className="aspect-[4/3]" />
                {f.key === "advisors" ? (
                  <div className="float-badge -bottom-6 right-6">
                    <span className="icon-chip"><Icon name="heart-handshake" size={16} /></span>
                    <span><strong>{t("features.advisors.badgeTitle")}</strong>{t("features.advisors.badgeText")}</span>
                  </div>
                ) : null}
              </div>
              <div className="grid content-center gap-5">
                <p className="eyebrow">{t(`features.${f.key}.eyebrow`)}</p>
                <h2>{t(`features.${f.key}.title`)}</h2>
                <p className="lead">{t(`features.${f.key}.text`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="berufe" className="section section-tint scroll-mt-16">
        <div className="container-page">
          <div className="section-head">
            <p className="eyebrow">{t("professionsKicker")}</p>
            <h2>{t("professionsTitle")}</h2>
            <p className="lead">{t("professionsLead")}</p>
          </div>
          {professions.length === 0 ? (
            <p className="notice notice-info">
              <Icon name="info" />
              {tSite("noProfessions")}
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {professions.map((p) => (
                <li key={p.slug} className="flex">
                  <Link href={`/apply/${p.slug}`} className="card w-full gap-4">
                    <span className="flex items-start justify-between gap-3">
                      <span className="icon-chip icon-chip-navy icon-chip-lg"><Icon name={p.icon} size={28} /></span>
                      <span className="tag tag-gold">{tSite("openPositions", { count: p.openPositions })}</span>
                    </span>
                    <span className="card-title">{localized(p.name, locale)}</span>
                    <span className="mt-auto flex items-center justify-between gap-3 border-t border-hairline pt-4">
                      <span className="text-sm text-fg-muted">{t("trust.free")}</span>
                      <span className="btn btn-primary btn-sm">{tSite("apply")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="ablauf" className="section scroll-mt-16">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="section-head">
              <p className="eyebrow">{t("stepsKicker")}</p>
              <h2>{t("stepsTitle")}</h2>
            </div>
            <ol className="timeline">
              {STEPS.map((step, i) => (
                <li key={step}>
                  <span className="timeline-dot" aria-hidden="true">{i + 1}</span>
                  <h3 className="text-xl">{t(`steps.${step}.title`)}</h3>
                  <p className="text-fg-muted">{t(`steps.${step}.text`)}</p>
                </li>
              ))}
            </ol>
          </div>
          <Photo slot="steps" alt={t("stepsAlt")} className="hidden aspect-square lg:grid" />
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="cta-banner">
          <Photo slot="employer-banner" alt="" sizes="100vw" />
          <p className="eyebrow">{t("doors.employerKicker")}</p>
          <h2 className="max-w-[20ch]">{t("doors.employerTitle")}</h2>
          <p className="lead">{t("doors.employerText")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/employers" className="btn btn-primary">
              {t("doors.employerCta")}
              <Icon name="arrow-right" />
            </Link>
            <Link href="/contact" className="btn">{t("doors.contactCta")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx playwright test e2e/layout.spec.ts && npm run typecheck && npm run lint`
Expected: PASS. Check `/en` and `/de` at 375, 768, 1280px: stat cards overlap the hero bottom from 860px, float badges appear from 720px and stay inside the viewport, the banner text is readable (white on navy, gold eyebrow).

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(site)/page.tsx" src/i18n e2e/layout.spec.ts
git commit -m "feat(site): photo-led home page with stats, features, timeline and employer banner

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Employers, contact and apply pages

**Files:**
- Modify (full rewrite): `src/app/[locale]/(site)/employers/page.tsx`, `src/app/[locale]/(site)/contact/page.tsx`, `src/app/[locale]/(site)/apply/[slug]/page.tsx`
- Modify: `src/features/professions/queries.ts` (`getApplyForm` returns `icon`)
- Modify: `e2e/layout.spec.ts` (overflow test)

**Interfaces:**
- Produces: `ApplyFormData = { slug: string; name: LocalizedText; icon: string; formId: string; definition: FormDefinition }`

- [ ] **Step 1: Write the failing overflow test**

Append to the `test.describe("phone width", …)` block in `e2e/layout.spec.ts`:
```ts
  for (const path of ["/de", "/de/employers", "/de/contact", "/de/apply/pflege"]) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
```
Run: `npx playwright test e2e/layout.spec.ts -g "horizontal"`
Expected: PASS or FAIL depending on current markup. It must pass at the end of this task; if it already passes, it stays as the regression guard.

- [ ] **Step 2: Add `icon` to `getApplyForm`**

In `src/features/professions/queries.ts`: change the type to
```ts
export type ApplyFormData = { slug: string; name: LocalizedText; icon: string; formId: string; definition: FormDefinition };
```
change the profession select to `.select("slug, name, icon, current_form_id")`, and add `icon: profession.icon,` to the returned object next to `name`.

- [ ] **Step 3: Rewrite the employers page**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { LeadForm } from "@/features/leads/LeadForm";
import { listActiveProfessions } from "@/features/professions/queries";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";

const BENEFITS = ["selection", "process", "support"] as const;

export default async function EmployersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, professions] = await Promise.all([getTranslations("employers"), listActiveProfessions()]);

  return (
    <section className="bg-accent-100/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:py-20">
        <div className="grid content-start gap-5">
          <p className="eyebrow">{t("kicker")}</p>
          <h1 className="text-3xl">{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
          <ul className="benefit-list pt-2">
            {BENEFITS.map((b) => (
              <li key={b}>
                <Icon name="circle-check" />
                {t(`benefits.${b}`)}
              </li>
            ))}
          </ul>
        </div>
        <Card className="gap-6 p-6 shadow-raised md:p-10">
          <h2 className="text-xl">{t("formTitle")}</h2>
          <LeadForm professions={professions.map((p) => ({ id: p.id, name: localized(p.name, locale) }))} />
        </Card>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Rewrite the contact page**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { ContactForm } from "@/features/leads/ContactForm";
import { WHATSAPP_NUMBER, WHATSAPP_URL } from "@/features/site/contact";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tSite] = await Promise.all([getTranslations("contact"), getTranslations("site")]);

  return (
    <section className="bg-accent-100/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:py-20">
        <div className="grid content-start gap-5">
          <p className="eyebrow">{t("kicker")}</p>
          <h1 className="text-3xl">{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
          <Card className="mt-4 items-start gap-4">
            <span className="icon-chip"><Icon name="message-circle" /></span>
            <h2 className="card-title">{t("whatsappTitle")}</h2>
            <p className="text-fg-muted">{t("whatsappText")}</p>
            <a href={WHATSAPP_URL} className="btn" target="_blank" rel="noopener noreferrer">
              <Icon name="message-circle" />
              {tSite("whatsapp")}: {WHATSAPP_NUMBER}
            </a>
          </Card>
        </div>
        <Card className="p-6 shadow-raised md:p-10">
          <ContactForm />
        </Card>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Rewrite the apply page**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { ApplyForm } from "@/features/applications/ApplyForm";
import { getApplyForm } from "@/features/professions/queries";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";

export default async function ApplyPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const form = await getApplyForm(slug);
  if (!form) notFound();
  const t = await getTranslations("apply");

  return (
    <div className="bg-accent-100/60">
      <div className="container-form grid gap-6 py-10 pb-24">
        <Link href="/#berufe" className="btn btn-ghost btn-sm -ml-3 max-w-max">
          <Icon name="arrow-left" size={16} />
          {t("back")}
        </Link>
        <Card className="gap-4 p-6 md:p-8">
          <span className="icon-chip icon-chip-navy icon-chip-lg"><Icon name={form.icon} size={28} /></span>
          <p className="eyebrow">{t("kicker")}</p>
          <h1 className="text-3xl">{t("title", { profession: localized(form.name, locale) })}</h1>
          <p className="lead">{t("lead")}</p>
        </Card>
        <Card className="p-6 md:p-10">
          <ApplyForm professionSlug={form.slug} formId={form.formId} definition={form.definition} locale={locale} />
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npx playwright test e2e/layout.spec.ts e2e/leads.spec.ts e2e/apply-and-review.spec.ts`
Expected: PASS. (`apply-and-review` still expects the post-login URL `/en/admin/applications`; Task 7 changes it.)
Run: `npm run typecheck && npm run lint`

- [ ] **Step 7: Commit**

```bash
git add "src/app/[locale]/(site)" src/features/professions/queries.ts e2e/layout.spec.ts
git commit -m "feat(site): tinted hero bands with form cards on employers, contact and apply

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Admin shell (sidebar, drawer, page header, auth layout)

**Files:**
- Create: `src/features/admin-dashboard/queries.ts`, `src/features/admin-shell/AdminSidebar.tsx`, `src/features/admin-shell/AdminDrawer.tsx`, `src/features/admin-shell/AdminPageHeader.tsx`
- Move: `src/features/admin-auth/AdminNav.tsx` → `src/features/admin-shell/AdminNav.tsx` (rewrite)
- Modify: `src/app/[locale]/admin/(protected)/layout.tsx` (rewrite), `src/app/[locale]/admin/(auth)/layout.tsx` (rewrite)
- Modify: `src/features/leads/admin-queries.ts` (delete `countNew`)
- Modify: `src/i18n/messages/en.json`, `src/i18n/messages/de.json`, `e2e/layout.spec.ts`

**Interfaces:**
- Produces:
  - `countDashboard(): Promise<{ applications: number; leads: number; messages: number; activeProfessions: number }>` (React `cache`, one query set per request)
  - `type NavGroup = { label: string; items: { href: string; label: string; icon: string; count?: number; exact?: boolean }[] }`
  - `AdminPageHeader({ title: ReactNode, back?: { href: string; label: string }, actions?: ReactNode })` renders `<header class="admin-page-head">` with an `<h1>`
  - message keys `admin.navDashboard`, `admin.navGroupInbox`, `admin.navGroupSetup`, `admin.menuOpen`, `admin.menuClose`

- [ ] **Step 1: Write the failing e2e test**

Append to `e2e/layout.spec.ts` (add `import { signIn } from "./helpers";` at the top):
```ts
test.describe("admin at phone width", () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test("the drawer opens with the section links and closes after navigating", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("link", { name: "Professions" })).toBeVisible();
    await drawer.getByRole("link", { name: /^Enquiries/ }).click();
    await expect(page).toHaveURL(/\/en\/admin\/leads$/);
    await expect(drawer).toBeHidden();
  });

  test("the drawer closes with Escape", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
```
Run: `npx playwright test e2e/layout.spec.ts -g "drawer"`
Expected: FAIL, no button "Open menu".

- [ ] **Step 2: Add the messages**

`en.json`, inside `"admin"`, after `"navMessages": …,` add:
```json
    "navDashboard": "Dashboard",
    "navGroupInbox": "Inbox",
    "navGroupSetup": "Setup",
    "menuOpen": "Open menu",
    "menuClose": "Close menu",
```
`de.json`, inside `"admin"`, after `"navMessages": …,` add:
```json
    "navDashboard": "Übersicht",
    "navGroupInbox": "Posteingang",
    "navGroupSetup": "Verwaltung",
    "menuOpen": "Menü öffnen",
    "menuClose": "Menü schließen",
```

- [ ] **Step 3: Add `countDashboard` and remove `countNew`**

`src/features/admin-dashboard/queries.ts`:
```ts
import "server-only";
import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";

export type DashboardCounts = { applications: number; leads: number; messages: number; activeProfessions: number };

/** New entries per inbox plus active professions. Cached per request: the layout badges and the dashboard share it. */
export const countDashboard = cache(async (): Promise<DashboardCounts> => {
  const supabase = await createServerSupabase();
  const head = { count: "exact", head: true } as const;
  const [applications, leads, messages, professions] = await Promise.all([
    supabase.from("applications").select("id", head).eq("status", "new").not("submitted_at", "is", null),
    supabase.from("employer_leads").select("id", head).eq("status", "new"),
    supabase.from("contact_messages").select("id", head).eq("status", "new"),
    supabase.from("professions").select("id", head).eq("is_active", true),
  ]);
  for (const result of [applications, leads, messages, professions]) if (result.error) throw result.error;
  return {
    applications: applications.count ?? 0,
    leads: leads.count ?? 0,
    messages: messages.count ?? 0,
    activeProfessions: professions.count ?? 0,
  };
});
```
In `src/features/leads/admin-queries.ts` delete the `/** Counts for the nav badges. */` comment and the whole `countNew` function. Run `grep -rn countNew src` and expect only the protected layout (rewritten in Step 6).

- [ ] **Step 4: Move and rewrite `AdminNav`**

```bash
git mv src/features/admin-auth/AdminNav.tsx src/features/admin-shell/AdminNav.tsx
```
`src/features/admin-shell/AdminNav.tsx`:
```tsx
"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { Icon } from "@/ui/Icon";

type Item = { href: string; label: string; icon: string; count?: number; exact?: boolean };
export type NavGroup = { label: string; items: Item[] };

/** Grouped admin section links; marks the current section with aria-current. */
export function AdminNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const isCurrent = (item: Item) => pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));
  return (
    <nav className="grid gap-5">
      {groups.map((group) => (
        <div key={group.label} className="side-group">
          <p className="side-group-label">{group.label}</p>
          {group.items.map((item) => (
            <Link key={item.href} href={item.href} className="side-link" aria-current={isCurrent(item) ? "page" : undefined}>
              <Icon name={item.icon} size={16} />
              {item.label}
              {item.count ? <span className="badge">{item.count}</span> : null}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 5: Sidebar, drawer, page header**

`src/features/admin-shell/AdminSidebar.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/features/admin-auth/actions";
import type { AdminSession } from "@/features/admin-auth/session";
import { BrandLogo } from "@/features/site/Brand";
import { Avatar } from "@/ui/Avatar";
import { Icon } from "@/ui/Icon";
import { AdminNav, type NavGroup } from "./AdminNav";

/** Sidebar content, used in the desktop column and in the mobile drawer. */
export async function AdminSidebar({ admin, groups, locale }: { admin: AdminSession; groups: NavGroup[]; locale: string }) {
  const t = await getTranslations("admin");
  return (
    <div className="side-panel">
      <Link href="/admin" className="brand px-2" aria-label="iPrince Admin">
        <BrandLogo />
      </Link>
      <AdminNav groups={groups} />
      <div className="user-card">
        <Avatar name={admin.displayName} />
        <div className="min-w-0 flex-1">
          <p className="user-card-name truncate">{admin.displayName}</p>
          <p className="user-card-role">{t(`team.roles.${admin.role}`)}</p>
        </div>
        <form action={signOut}>
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="btn btn-ghost btn-sm btn-icon" aria-label={t("signOut")} title={t("signOut")}>
            <Icon name="log-out" size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
```

`src/features/admin-shell/AdminDrawer.tsx`:
```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { Icon } from "@/ui/Icon";

type Props = { children: ReactNode; openLabel: string; closeLabel: string };

/** Below 1000px the sidebar opens in a modal drawer. Closes on Escape (native), on the backdrop and on any link. */
export function AdminDrawer({ children, openLabel, closeLabel }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="btn btn-ghost btn-icon" aria-label={openLabel} onClick={() => dialog.current?.showModal()}>
        <Icon name="menu" />
      </button>
      <dialog
        ref={dialog}
        className="drawer"
        aria-label={openLabel}
        onClick={(event) => {
          const target = event.target as Element;
          if (target === event.currentTarget || target.closest("a")) event.currentTarget.close();
        }}
      >
        <button type="button" className="btn btn-ghost btn-sm btn-icon absolute top-4 right-3" aria-label={closeLabel} onClick={() => dialog.current?.close()}>
          <Icon name="x" size={16} />
        </button>
        {children}
      </dialog>
    </>
  );
}
```

`src/features/admin-shell/AdminPageHeader.tsx`:
```tsx
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/ui/Icon";

type Props = { title: ReactNode; back?: { href: string; label: string }; actions?: ReactNode };

/** White title bar at the top of every admin page: optional back link, the page's h1, optional actions. */
export function AdminPageHeader({ title, back, actions }: Props) {
  return (
    <header className="admin-page-head">
      <div className="grid min-w-0 gap-1">
        {back ? (
          <Link href={back.href} className="admin-back">
            <Icon name="arrow-left" size={16} />
            {back.label}
          </Link>
        ) : null}
        <h1>{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
```

- [ ] **Step 6: Rewrite the protected layout**

`src/app/[locale]/admin/(protected)/layout.tsx`:
```tsx
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { countDashboard } from "@/features/admin-dashboard/queries";
import { AdminDrawer } from "@/features/admin-shell/AdminDrawer";
import type { NavGroup } from "@/features/admin-shell/AdminNav";
import { AdminSidebar } from "@/features/admin-shell/AdminSidebar";
import { BrandLogo } from "@/features/site/Brand";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) notFound();
  const admin = await requireAdmin(locale);
  const [t, counts] = await Promise.all([getTranslations("admin"), countDashboard()]);
  const groups: NavGroup[] = [
    {
      label: t("navGroupInbox"),
      items: [
        { href: "/admin", label: t("navDashboard"), icon: "layout-grid", exact: true },
        { href: "/admin/applications", label: t("applications"), icon: "inbox", count: counts.applications },
        { href: "/admin/leads", label: t("navLeads"), icon: "building-2", count: counts.leads },
        { href: "/admin/messages", label: t("navMessages"), icon: "mail", count: counts.messages },
      ],
    },
    {
      label: t("navGroupSetup"),
      items: [
        { href: "/admin/professions", label: t("navProfessions"), icon: "briefcase" },
        ...(admin.role === "owner"
          ? [
              { href: "/admin/team", label: t("navTeam"), icon: "users" },
              { href: "/admin/settings", label: t("navSettings"), icon: "settings" },
            ]
          : []),
      ],
    },
  ];
  const sidebar = <AdminSidebar admin={admin} groups={groups} locale={locale} />;

  return (
    <div className="admin">
      <aside className="admin-side">{sidebar}</aside>
      <div className="admin-topbar">
        <AdminDrawer openLabel={t("menuOpen")} closeLabel={t("menuClose")}>{sidebar}</AdminDrawer>
        <Link href="/admin" className="brand" aria-label="iPrince Admin">
          <BrandLogo />
        </Link>
      </div>
      <main id="main" className="admin-main">{children}</main>
    </div>
  );
}
```
Until Task 7, `/admin` still redirects to `/admin/applications`, so the Dashboard link lands there.

Until each page adopts `AdminPageHeader` (Tasks 7–10), pages still start with their old `<Stack>` and sit flush against the top of `.admin-main` on desktop. That is acceptable for the intermediate commits; do not add temporary padding.

- [ ] **Step 7: Rewrite the auth layout**

`src/app/[locale]/admin/(auth)/layout.tsx`:
```tsx
import { BrandLogo } from "@/features/site/Brand";
import { Card } from "@/ui/Card";

/** Sign-in and invite pages: one card on a tinted background. No session exists yet. */
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-screen place-items-center bg-accent-100 px-[var(--gutter)] py-12">
      <div className="grid w-full max-w-[440px] gap-8">
        <span className="brand mx-auto">
          <BrandLogo />
        </span>
        <Card className="p-8 shadow-raised">{children}</Card>
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Run: `npx playwright test e2e/layout.spec.ts e2e/leads.spec.ts e2e/team.spec.ts`
Expected: PASS (leads asserts sidebar links `Enquiries <n>` and `Messages <n>`; team asserts editors have no `Team` link).

- [ ] **Step 9: Commit**

```bash
git add -A src/features/admin-shell src/features/admin-auth src/features/admin-dashboard src/features/leads/admin-queries.ts "src/app/[locale]/admin" src/i18n e2e/layout.spec.ts
git commit -m "feat(admin): light sidebar with grouped nav, mobile drawer and page header

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Dashboard

**Files:**
- Create: `src/features/admin-dashboard/recent.ts`, `src/features/admin-dashboard/recent.test.ts`, `e2e/dashboard.spec.ts`
- Modify (rewrite): `src/app/[locale]/admin/(protected)/page.tsx`
- Modify: `src/features/applications/admin-queries.ts` (`listApplications` limit), `src/features/leads/admin-queries.ts` (`listLeads`, `listMessages` limit)
- Modify: `src/features/admin-auth/actions.ts:31,55`, `src/app/[locale]/admin/(auth)/login/page.tsx:14`
- Modify: `e2e/helpers.ts`, `e2e/apply-and-review.spec.ts`, `e2e/team.spec.ts:42`
- Modify: `src/i18n/messages/en.json`, `src/i18n/messages/de.json`

**Interfaces:**
- Consumes: `countDashboard` (Task 6), `AdminPageHeader` (Task 6), `Card`, `Avatar`, `EmptyState` (Task 1).
- Produces:
  - `type InboxItem = { kind: "lead"; id; title; status: LeadStatus; createdAt } | { kind: "message"; id; title; status: MessageStatus; createdAt }`
  - `mergeRecent(leads: { id: string; company: string; status: LeadStatus; createdAt: string }[], messages: { id: string; name: string; status: MessageStatus; createdAt: string }[], limit: number): InboxItem[]`
  - `listApplications(status?: ApplicationStatus, limit = INBOX_LIMIT)`, `listLeads(status?: LeadStatus, limit = INBOX_LIMIT)`, `listMessages(status?: MessageStatus, limit = INBOX_LIMIT)`
  - e2e helpers `submitApplication(page: Page, name: string)`, `resetRateLimit(bucket: string)`

- [ ] **Step 1: Write the failing unit test**

`src/features/admin-dashboard/recent.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { mergeRecent } from "./recent";

const lead = (id: string, createdAt: string) => ({ id, company: `Company ${id}`, status: "new" as const, createdAt });
const message = (id: string, createdAt: string) => ({ id, name: `Sender ${id}`, status: "read" as const, createdAt });

describe("mergeRecent", () => {
  it("interleaves enquiries and messages, newest first", () => {
    const items = mergeRecent(
      [lead("l1", "2026-10-01T10:00:00Z"), lead("l2", "2026-09-30T10:00:00Z")],
      [message("m1", "2026-10-01T12:00:00Z")],
      5,
    );
    expect(items.map((i) => i.id)).toEqual(["m1", "l1", "l2"]);
    expect(items[0]).toEqual({ kind: "message", id: "m1", title: "Sender m1", status: "read", createdAt: "2026-10-01T12:00:00Z" });
    expect(items[1]).toMatchObject({ kind: "lead", title: "Company l1", status: "new" });
  });

  it("keeps at most `limit` items", () => {
    const leads = ["1", "2", "3"].map((d) => lead(d, `2026-10-0${d}T00:00:00Z`));
    expect(mergeRecent(leads, [], 2).map((i) => i.id)).toEqual(["3", "2"]);
  });

  it("compares instants, not strings with different offsets", () => {
    const items = mergeRecent([lead("l", "2026-10-01T10:00:00+02:00")], [message("m", "2026-10-01T09:00:00+00:00")], 5);
    expect(items.map((i) => i.id)).toEqual(["m", "l"]);
  });

  it("returns an empty list when there is nothing", () => expect(mergeRecent([], [], 5)).toEqual([]));
});
```
Run: `npx vitest run src/features/admin-dashboard/recent.test.ts`
Expected: FAIL, cannot resolve `./recent`.

- [ ] **Step 2: Implement `recent.ts`**

```ts
import type { LeadStatus, MessageStatus } from "@/features/leads/schema";

export type InboxItem =
  | { kind: "lead"; id: string; title: string; status: LeadStatus; createdAt: string }
  | { kind: "message"; id: string; title: string; status: MessageStatus; createdAt: string };

type LeadLike = { id: string; company: string; status: LeadStatus; createdAt: string };
type MessageLike = { id: string; name: string; status: MessageStatus; createdAt: string };

/** Enquiries and contact messages as one list, newest first, at most `limit` items. */
export function mergeRecent(leads: LeadLike[], messages: MessageLike[], limit: number): InboxItem[] {
  const items: InboxItem[] = [
    ...leads.map((l) => ({ kind: "lead" as const, id: l.id, title: l.company, status: l.status, createdAt: l.createdAt })),
    ...messages.map((m) => ({ kind: "message" as const, id: m.id, title: m.name, status: m.status, createdAt: m.createdAt })),
  ];
  return items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, limit);
}
```
Run: `npx vitest run src/features/admin-dashboard/recent.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 3: Add the `limit` parameter to the list queries**

- `src/features/applications/admin-queries.ts`: `export async function listApplications(status?: ApplicationStatus, limit = INBOX_LIMIT)` and `.limit(limit)`.
- `src/features/leads/admin-queries.ts`: same change for `listLeads(status?: LeadStatus, limit = INBOX_LIMIT)` and `listMessages(status?: MessageStatus, limit = INBOX_LIMIT)`.

- [ ] **Step 4: Add the dashboard copy**

`en.json` `"admin"`, add after `"menuClose"`:
```json
    "dashboard": {
      "title": "Dashboard",
      "newApplications": "New applications",
      "newLeads": "New enquiries",
      "newMessages": "New messages",
      "activeProfessions": "Active professions",
      "latestApplications": "Latest applications",
      "latestInbox": "Latest enquiries and messages",
      "viewAll": "View all",
      "emptyInbox": "No enquiries or messages yet.",
      "kindLead": "Enquiry",
      "kindMessage": "Message"
    },
```
`de.json` `"admin"`, add after `"menuClose"`:
```json
    "dashboard": {
      "title": "Übersicht",
      "newApplications": "Neue Bewerbungen",
      "newLeads": "Neue Anfragen",
      "newMessages": "Neue Nachrichten",
      "activeProfessions": "Aktive Berufe",
      "latestApplications": "Neueste Bewerbungen",
      "latestInbox": "Neueste Anfragen und Nachrichten",
      "viewAll": "Alle anzeigen",
      "emptyInbox": "Noch keine Anfragen oder Nachrichten.",
      "kindLead": "Anfrage",
      "kindMessage": "Nachricht"
    },
```

- [ ] **Step 5: Write the dashboard page**

`src/app/[locale]/admin/(protected)/page.tsx`:
```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { countDashboard } from "@/features/admin-dashboard/queries";
import { mergeRecent } from "@/features/admin-dashboard/recent";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { listApplications } from "@/features/applications/admin-queries";
import { STATUS_TONE } from "@/features/applications/review";
import { listLeads, listMessages } from "@/features/leads/admin-queries";
import { LEAD_STATUS_TONE, MESSAGE_STATUS_TONE } from "@/features/leads/inbox";
import { localized } from "@/lib/i18n/localized";
import { Avatar } from "@/ui/Avatar";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Icon } from "@/ui/Icon";
import { Status } from "@/ui/Status";

const RECENT = 5;

export default async function DashboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, format, counts, applications, leads, messages] = await Promise.all([
    getTranslations("admin"),
    getFormatter(),
    countDashboard(),
    listApplications(undefined, RECENT),
    listLeads(undefined, RECENT),
    listMessages(undefined, RECENT),
  ]);
  const inbox = mergeRecent(leads, messages, RECENT);
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" });
  const stats = [
    { href: { pathname: "/admin/applications", query: { status: "new" } }, icon: "inbox", value: counts.applications, label: t("dashboard.newApplications") },
    { href: { pathname: "/admin/leads", query: { status: "new" } }, icon: "building-2", value: counts.leads, label: t("dashboard.newLeads") },
    { href: { pathname: "/admin/messages", query: { status: "new" } }, icon: "mail", value: counts.messages, label: t("dashboard.newMessages") },
    { href: { pathname: "/admin/professions" }, icon: "briefcase", value: counts.activeProfessions, label: t("dashboard.activeProfessions") },
  ];

  return (
    <>
      <AdminPageHeader title={t("dashboard.title")} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card stat">
            <span className="icon-chip"><Icon name={s.icon} /></span>
            <span>
              <span className="stat-value">{format.number(s.value)}</span>
              <span className="stat-label">{s.label}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="card-flush">
          <div className="card-head px-6 py-4">
            <h2 className="card-title">{t("dashboard.latestApplications")}</h2>
            <Link href="/admin/applications" className="btn btn-ghost btn-sm">{t("dashboard.viewAll")}</Link>
          </div>
          {applications.length === 0 ? <EmptyState icon="inbox" text={t("empty")} /> : (
            <ul className="divide-y divide-hairline border-t border-hairline">
              {applications.map((a) => (
                <li key={a.id} className="relative flex items-center gap-3 px-6 py-3 hover:bg-canvas">
                  <Avatar name={a.fullName} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/applications/${a.id}`} className="row-link">{a.fullName}</Link>
                    <p className="cell-sub truncate">{localized(a.professionName, locale)} · {date(a.submittedAt)}</p>
                  </div>
                  <Status tone={STATUS_TONE[a.status]}>{t(`statuses.${a.status}`)}</Status>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="card-flush">
          <div className="card-head px-6 py-4">
            <h2 className="card-title">{t("dashboard.latestInbox")}</h2>
          </div>
          {inbox.length === 0 ? <EmptyState icon="mail" text={t("dashboard.emptyInbox")} /> : (
            <ul className="divide-y divide-hairline border-t border-hairline">
              {inbox.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="relative flex items-center gap-3 px-6 py-3 hover:bg-canvas">
                  <Avatar name={item.title} />
                  <div className="min-w-0 flex-1">
                    <Link href={item.kind === "lead" ? `/admin/leads/${item.id}` : `/admin/messages/${item.id}`} className="row-link">
                      {item.title}
                    </Link>
                    <p className="cell-sub truncate">
                      {item.kind === "lead" ? t("dashboard.kindLead") : t("dashboard.kindMessage")} · {date(item.createdAt)}
                    </p>
                  </div>
                  {item.kind === "lead" ? (
                    <Status tone={LEAD_STATUS_TONE[item.status]}>{t(`inbox.leadStatuses.${item.status}`)}</Status>
                  ) : (
                    <Status tone={MESSAGE_STATUS_TONE[item.status]}>{t(`inbox.messageStatuses.${item.status}`)}</Status>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
```
If `next-intl`'s `Link` rejects the `{ pathname, query }` object type, check `node_modules/next-intl` docs for `createNavigation` hrefs and use the documented object form; do not fall back to string concatenation without checking.

- [ ] **Step 6: Land on the dashboard after sign-in**

- `src/features/admin-auth/actions.ts`: both `redirect(\`/${locale}/admin/applications\`)` (after sign-in and after set-password) become `redirect(\`/${locale}/admin\`)`.
- `src/app/[locale]/admin/(auth)/login/page.tsx`: `if (await getAdminSession()) redirect(\`/${locale}/admin\`);`

- [ ] **Step 7: Update the e2e helpers and expectations**

`e2e/helpers.ts`:
```ts
import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { E2E_ADMIN } from "./global-setup";

export async function signIn(page: Page, { email, password } = E2E_ADMIN) {
  await page.goto("/en/admin/login");
  await page.locator("#admin-email").fill(email);
  await page.locator("#admin-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/admin$/);
}

/** Locally every request has IP "unknown", so repeated runs would hit the hourly limit. */
export async function resetRateLimit(bucket: string) {
  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from("rate_limits").delete().eq("bucket", bucket);
  if (error) throw error;
}

/** Fills and sends the seeded nursing application form. */
export async function submitApplication(page: Page, name: string) {
  await page.goto("/en/apply/pflege");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nursing & healthcare");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill("candidate@example.com");
  await page.getByLabel("German level").selectOption("B2");
  await page.getByLabel("Years of experience").fill("4");
  await page.getByLabel("Specialisation").selectOption("intensive");
  await page.getByLabel("Recognition process already started").check();
  await page.getByLabel("CV (PDF)").setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% e2e test\n") });
  await page.getByRole("button", { name: "Send application" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you", { timeout: 15_000 });
}
```
Keep any other exports `helpers.ts` already has (check the file first; only `signIn` exists at the time of writing).

`e2e/apply-and-review.spec.ts`, first test: replace everything from `await page.goto("/en/apply/pflege");` up to and including the `toHaveURL(/\/en\/admin\/applications$/)` line with:
```ts
  await resetRateLimit("apply");
  await submitApplication(page, name);
  await signIn(page);
```
and the imports with `import { resetRateLimit, signIn, submitApplication } from "./helpers";` (drop the `E2E_ADMIN` import if unused). The next line, `await page.getByRole("link", { name }).click();`, now clicks the applicant in the dashboard's "Latest applications" card.

`e2e/team.spec.ts:42`: `await expect(editor).toHaveURL(/\/en\/admin$/);`

- [ ] **Step 8: Write the dashboard e2e test**

`e2e/dashboard.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { resetRateLimit, signIn, submitApplication } from "./helpers";

test("the dashboard counts a new application and links to the filtered list", async ({ page }) => {
  const name = `E2E Dashboard ${Date.now()}`;
  await resetRateLimit("apply");
  await submitApplication(page, name);
  await signIn(page);

  const card = page.getByRole("link", { name: /New applications/ });
  const count = Number((await card.locator(".stat-value").textContent())?.replace(/\D/g, ""));
  expect(count).toBeGreaterThanOrEqual(1);
  await expect(page.getByRole("link", { name })).toBeVisible();

  await card.click();
  await expect(page).toHaveURL(/\/en\/admin\/applications\?status=new$/);
  await expect(page.getByRole("link", { name })).toBeVisible();
});
```

- [ ] **Step 9: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Run: `npx playwright test e2e/dashboard.spec.ts e2e/apply-and-review.spec.ts e2e/team.spec.ts e2e/leads.spec.ts e2e/profession-builder.spec.ts`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add -A src e2e
git commit -m "feat(admin): dashboard with inbox counts and latest entries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Admin list pages (status tabs, avatars, empty states)

**Files:**
- Create: `src/features/admin-shell/StatusTabs.tsx`
- Modify (rewrite): `src/app/[locale]/admin/(protected)/applications/page.tsx`, `.../leads/page.tsx`, `.../messages/page.tsx`, `.../team/page.tsx`
- Modify: `src/i18n/messages/en.json`, `src/i18n/messages/de.json`, `e2e/dashboard.spec.ts`

**Interfaces:**
- Consumes: `pickStatus` (Task 1), `AdminPageHeader` (Task 6).
- Produces: `StatusTabs<S extends string>({ href: string, current: S | undefined, statuses: readonly S[], label: (s: S) => string, allLabel: string, ariaLabel: string })`; key `admin.statusFilter`.

- [ ] **Step 1: Extend the dashboard e2e test (fails first)**

Append to the test in `e2e/dashboard.spec.ts`:
```ts
  await expect(page.getByRole("link", { name: "New", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "All statuses" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/applications$/);
  await page.goto("/en/admin/applications?status=bogus");
  await expect(page.getByRole("link", { name: "All statuses" })).toHaveAttribute("aria-current", "page");
```
Run: `npx playwright test e2e/dashboard.spec.ts`
Expected: FAIL, no link "New".

- [ ] **Step 2: Add the message**

`en.json` `"admin"`: `"statusFilter": "Filter by status",`. `de.json` `"admin"`: `"statusFilter": "Nach Status filtern",`.

- [ ] **Step 3: `StatusTabs`**

`src/features/admin-shell/StatusTabs.tsx`:
```tsx
import { Link } from "@/i18n/navigation";

type Props<S extends string> = {
  href: string;
  current: S | undefined;
  statuses: readonly S[];
  label: (status: S) => string;
  allLabel: string;
  ariaLabel: string;
};

/** Status filter as links to ?status=…; the current one carries aria-current. */
export function StatusTabs<S extends string>({ href, current, statuses, label, allLabel, ariaLabel }: Props<S>) {
  return (
    <nav className="tabs" aria-label={ariaLabel}>
      <Link href={href} className="tab" aria-current={current === undefined ? "page" : undefined}>{allLabel}</Link>
      {statuses.map((status) => (
        <Link key={status} href={{ pathname: href, query: { status } }} className="tab" aria-current={current === status ? "page" : undefined}>
          {label(status)}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Applications list**

`src/app/[locale]/admin/(protected)/applications/page.tsx`:
```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { StatusTabs } from "@/features/admin-shell/StatusTabs";
import { INBOX_LIMIT, listApplications } from "@/features/applications/admin-queries";
import { APPLICATION_STATUSES, STATUS_TONE } from "@/features/applications/review";
import { localized } from "@/lib/i18n/localized";
import { pickStatus } from "@/lib/status-param";
import { Avatar } from "@/ui/Avatar";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Status } from "@/ui/Status";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string | string[] }> };

export default async function ApplicationsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const status = pickStatus((await searchParams).status, APPLICATION_STATUSES);
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listApplications(status)]);

  return (
    <>
      <AdminPageHeader title={t("applications")} />
      <Card className="card-flush">
        <StatusTabs
          href="/admin/applications"
          current={status}
          statuses={APPLICATION_STATUSES}
          label={(s) => t(`statuses.${s}`)}
          allLabel={t("allStatuses")}
          ariaLabel={t("statusFilter")}
        />
        {rows.length === 0 ? <EmptyState icon="inbox" text={t("empty")} /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t("applicant")}</th>
                  <th scope="col">{t("profession")}</th>
                  <th scope="col">{t("status")}</th>
                  <th scope="col">{t("submittedAt")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="name-cell">
                        <Avatar name={row.fullName} />
                        <Link href={`/admin/applications/${row.id}`} className="row-link">{row.fullName}</Link>
                      </div>
                    </td>
                    <td>{localized(row.professionName, locale)}</td>
                    <td><Status tone={STATUS_TONE[row.status]}>{t(`statuses.${row.status}`)}</Status></td>
                    <td className="nowrap muted">{format.dateTime(new Date(row.submittedAt), { dateStyle: "medium", timeStyle: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {rows.length === INBOX_LIMIT ? <Text tone="muted" size="sm">{t("limitNotice", { count: INBOX_LIMIT })}</Text> : null}
    </>
  );
}
```

- [ ] **Step 5: Leads list**

`src/app/[locale]/admin/(protected)/leads/page.tsx`:
```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { StatusTabs } from "@/features/admin-shell/StatusTabs";
import { INBOX_LIMIT } from "@/features/applications/admin-queries";
import { listLeads } from "@/features/leads/admin-queries";
import { LEAD_STATUS_TONE } from "@/features/leads/inbox";
import { LEAD_STATUSES } from "@/features/leads/schema";
import { localized } from "@/lib/i18n/localized";
import { pickStatus } from "@/lib/status-param";
import { Avatar } from "@/ui/Avatar";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Status } from "@/ui/Status";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string | string[] }> };

export default async function LeadsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const status = pickStatus((await searchParams).status, LEAD_STATUSES);
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listLeads(status)]);

  return (
    <>
      <AdminPageHeader title={t("inbox.leadsTitle")} />
      <Card className="card-flush">
        <StatusTabs
          href="/admin/leads"
          current={status}
          statuses={LEAD_STATUSES}
          label={(s) => t(`inbox.leadStatuses.${s}`)}
          allLabel={t("allStatuses")}
          ariaLabel={t("statusFilter")}
        />
        {rows.length === 0 ? <EmptyState icon="building-2" text={t("inbox.emptyLeads")} /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t("inbox.company")}</th>
                  <th scope="col">{t("inbox.contactName")}</th>
                  <th scope="col">{t("inbox.professions")}</th>
                  <th scope="col">{t("status")}</th>
                  <th scope="col">{t("inbox.received")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="name-cell">
                        <Avatar name={row.company} />
                        <Link href={`/admin/leads/${row.id}`} className="row-link">{row.company}</Link>
                      </div>
                    </td>
                    <td>{row.contactName}</td>
                    <td>{row.professionNames.map((n) => localized(n, locale)).join(", ") || "—"}</td>
                    <td><Status tone={LEAD_STATUS_TONE[row.status]}>{t(`inbox.leadStatuses.${row.status}`)}</Status></td>
                    <td className="nowrap muted">{format.dateTime(new Date(row.createdAt), { dateStyle: "medium", timeStyle: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {rows.length === INBOX_LIMIT ? <Text tone="muted" size="sm">{t("inbox.limitNotice", { count: INBOX_LIMIT })}</Text> : null}
    </>
  );
}
```

- [ ] **Step 6: Messages list**

`src/app/[locale]/admin/(protected)/messages/page.tsx`:
```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { StatusTabs } from "@/features/admin-shell/StatusTabs";
import { INBOX_LIMIT } from "@/features/applications/admin-queries";
import { listMessages } from "@/features/leads/admin-queries";
import { MESSAGE_STATUS_TONE } from "@/features/leads/inbox";
import { MESSAGE_STATUSES } from "@/features/leads/schema";
import { pickStatus } from "@/lib/status-param";
import { Avatar } from "@/ui/Avatar";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Status } from "@/ui/Status";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string | string[] }> };

export default async function MessagesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const status = pickStatus((await searchParams).status, MESSAGE_STATUSES);
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listMessages(status)]);

  return (
    <>
      <AdminPageHeader title={t("inbox.messagesTitle")} />
      <Card className="card-flush">
        <StatusTabs
          href="/admin/messages"
          current={status}
          statuses={MESSAGE_STATUSES}
          label={(s) => t(`inbox.messageStatuses.${s}`)}
          allLabel={t("allStatuses")}
          ariaLabel={t("statusFilter")}
        />
        {rows.length === 0 ? <EmptyState icon="mail" text={t("inbox.emptyMessages")} /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t("inbox.name")}</th>
                  <th scope="col">{t("inbox.message")}</th>
                  <th scope="col">{t("status")}</th>
                  <th scope="col">{t("inbox.received")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="name-cell">
                        <Avatar name={row.name} />
                        <Link href={`/admin/messages/${row.id}`} className="row-link">{row.name}</Link>
                      </div>
                    </td>
                    <td className="muted">{row.preview}</td>
                    <td><Status tone={MESSAGE_STATUS_TONE[row.status]}>{t(`inbox.messageStatuses.${row.status}`)}</Status></td>
                    <td className="nowrap muted">{format.dateTime(new Date(row.createdAt), { dateStyle: "medium", timeStyle: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {rows.length === INBOX_LIMIT ? <Text tone="muted" size="sm">{t("inbox.limitNotice", { count: INBOX_LIMIT })}</Text> : null}
    </>
  );
}
```

- [ ] **Step 7: Team page**

`src/app/[locale]/admin/(protected)/team/page.tsx`:
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireOwner } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { InviteForm } from "@/features/team/InviteForm";
import { listTeam } from "@/features/team/queries";
import { RemoveMemberForm } from "@/features/team/RemoveMemberForm";
import { canRemove } from "@/features/team/team";
import { Avatar } from "@/ui/Avatar";
import { Card } from "@/ui/Card";
import { Status } from "@/ui/Status";

export default async function TeamPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const owner = await requireOwner(locale);
  const [t, members] = await Promise.all([getTranslations("admin.team"), listTeam()]);

  return (
    <>
      <AdminPageHeader title={t("title")} />
      <Card className="card-flush">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t("name")}</th>
                <th scope="col">{t("email")}</th>
                <th scope="col">{t("role")}</th>
                <th scope="col">{t("status")}</th>
                <th scope="col" className="actions"><span className="sr-only">{t("remove")}</span></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.userId}>
                  <td>
                    <div className="name-cell">
                      <Avatar name={m.displayName} />
                      <span className="cell-primary">{m.displayName}</span>
                    </div>
                  </td>
                  <td>{m.email}</td>
                  <td>{t(`roles.${m.role}`)}</td>
                  <td><Status tone={m.status === "active" ? "ok" : "review"}>{t(`statuses.${m.status}`)}</Status></td>
                  <td className="actions">{canRemove(m, owner.userId) ? <RemoveMemberForm userId={m.userId} locale={locale} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="max-w-2xl gap-5">
        <h2 className="card-title">{t("invite")}</h2>
        <InviteForm locale={locale} />
      </Card>
    </>
  );
}
```
`team.spec.ts` locates rows with a `row()` helper; check it still matches (it filters table rows by email or name text; the avatar adds two letters to the row text, which does not break `toContainText`).

- [ ] **Step 8: Verify**

Run: `npm run typecheck && npm run lint`
Run: `npx playwright test e2e/dashboard.spec.ts e2e/leads.spec.ts e2e/team.spec.ts e2e/apply-and-review.spec.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A src e2e/dashboard.spec.ts
git commit -m "feat(admin): card lists with status tabs, avatars and empty states

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Admin detail pages

**Files:**
- Modify (rewrite): `src/app/[locale]/admin/(protected)/applications/[id]/page.tsx`, `.../leads/[id]/page.tsx`, `.../messages/[id]/page.tsx`
- Modify: `src/features/leads/DeleteEntryForm.tsx` (drop the top border class on `<form>`)
- Modify: `src/i18n/messages/en.json`, `src/i18n/messages/de.json`

**Interfaces:**
- Produces: keys `admin.review`, `admin.dangerZone`.

These pages are covered by existing e2e (`apply-and-review`, `leads`), which pin: h1 = applicant/company/sender name, `cv.pdf` link, `#review-status`, `#lead-status`, `#lead-notes`, `#message-status`, the "Save" and "Delete" buttons, "Nursing & healthcare" and the message text appearing exactly once.

- [ ] **Step 1: Messages**

`en.json` `"admin"`: `"review": "Review",` and `"dangerZone": "Delete entry",`. `de.json` `"admin"`: `"review": "Bearbeitung",` and `"dangerZone": "Eintrag löschen",`.

- [ ] **Step 2: `DeleteEntryForm`**

In `src/features/leads/DeleteEntryForm.tsx` change `<form action={action} className="border-t border-hairline pt-6">` to `<form action={action}>`.

- [ ] **Step 3: Application detail**

```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { getApplicationDetail } from "@/features/applications/admin-queries";
import { ReviewForm } from "@/features/applications/ReviewForm";
import { telHref } from "@/features/leads/inbox";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, tApply, format] = await Promise.all([getTranslations("admin"), getTranslations("apply"), getFormatter()]);
  const app = await getApplicationDetail(id, locale, { yes: tApply("yes"), no: tApply("no") });
  if (!app) notFound();

  return (
    <>
      <AdminPageHeader title={app.fullName} back={{ href: "/admin/applications", label: t("back") }} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <Card>
            <dl className="kv">
              <div><dt>{t("profession")}</dt><dd>{localized(app.professionName, locale)}</dd></div>
              <div><dt>{t("inbox.email")}</dt><dd><a href={`mailto:${app.email}`}>{app.email}</a></dd></div>
              <div><dt>{t("inbox.phone")}</dt><dd>{app.phone ? <a href={telHref(app.phone)}>{app.phone}</a> : "—"}</dd></div>
              <div>
                <dt>{t("submittedAt")}</dt>
                <dd>{format.dateTime(new Date(app.submittedAt), { dateStyle: "medium", timeStyle: "short" })} · {app.locale.toUpperCase()}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <h2 className="card-title">{t("answers")}</h2>
            <dl className="kv">
              {app.answers.map((a) => (
                <div key={a.key}><dt>{a.label}</dt><dd>{a.value}</dd></div>
              ))}
            </dl>
          </Card>
          <Card>
            <h2 className="card-title">{t("documents")}</h2>
            {app.files.length === 0 ? <p className="muted">—</p> : (
              <ul className="file-chips">
                {app.files.map((f) => (
                  <li key={f.path} className="grid gap-1">
                    <span className="text-xs text-fg-muted">{f.label}</span>
                    {f.url ? (
                      <a href={f.url} target="_blank" rel="noreferrer" className="file-chip">
                        <Icon name="file-text" size={16} />
                        {f.name}
                      </a>
                    ) : (
                      <span className="file-chip"><Icon name="file-text" size={16} />{f.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card className="xl:sticky xl:top-6">
          <h2 className="card-title">{t("review")}</h2>
          <ReviewForm id={app.id} locale={locale} status={app.status} adminNotes={app.adminNotes} />
        </Card>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Lead detail**

```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { getLead } from "@/features/leads/admin-queries";
import { DeleteEntryForm } from "@/features/leads/DeleteEntryForm";
import { telHref } from "@/features/leads/inbox";
import { LeadReviewForm } from "@/features/leads/LeadReviewForm";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";

export default async function LeadDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, format, lead] = await Promise.all([getTranslations("admin"), getFormatter(), getLead(id)]);
  if (!lead) notFound();
  const professions = lead.professionNames.map((n) => localized(n, locale)).join(", ");

  return (
    <>
      <AdminPageHeader title={lead.company} back={{ href: "/admin/leads", label: t("inbox.backToLeads") }} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <Card>
            <dl className="kv">
              <div><dt>{t("inbox.contactName")}</dt><dd>{lead.contactName}</dd></div>
              <div><dt>{t("inbox.email")}</dt><dd><a href={`mailto:${lead.email}`}>{lead.email}</a></dd></div>
              <div><dt>{t("inbox.phone")}</dt><dd>{lead.phone ? <a href={telHref(lead.phone)}>{lead.phone}</a> : "—"}</dd></div>
              <div><dt>{t("inbox.headcount")}</dt><dd>{lead.headcount ?? "—"}</dd></div>
              <div><dt>{t("inbox.professions")}</dt><dd>{professions || "—"}</dd></div>
              <div><dt>{t("inbox.received")}</dt><dd>{format.dateTime(new Date(lead.createdAt), { dateStyle: "medium", timeStyle: "short" })}</dd></div>
            </dl>
          </Card>
          {lead.message ? (
            <Card>
              <h2 className="card-title">{t("inbox.message")}</h2>
              <p className="whitespace-pre-wrap">{lead.message}</p>
            </Card>
          ) : null}
        </div>
        <div className="grid gap-6 xl:sticky xl:top-6">
          <Card>
            <h2 className="card-title">{t("review")}</h2>
            <LeadReviewForm id={lead.id} locale={locale} status={lead.status} adminNotes={lead.adminNotes} />
          </Card>
          <Card>
            <h2 className="card-title">{t("dangerZone")}</h2>
            <DeleteEntryForm kind="lead" id={lead.id} locale={locale} />
          </Card>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Message detail**

```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { getMessage } from "@/features/leads/admin-queries";
import { DeleteEntryForm } from "@/features/leads/DeleteEntryForm";
import { MessageStatusForm } from "@/features/leads/MessageStatusForm";
import { Card } from "@/ui/Card";

export default async function MessageDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, format, message] = await Promise.all([getTranslations("admin"), getFormatter(), getMessage(id)]);
  if (!message) notFound();

  return (
    <>
      <AdminPageHeader title={message.name} back={{ href: "/admin/messages", label: t("inbox.backToMessages") }} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <dl className="kv">
            <div><dt>{t("inbox.email")}</dt><dd><a href={`mailto:${message.email}`}>{message.email}</a></dd></div>
            <div><dt>{t("inbox.received")}</dt><dd>{format.dateTime(new Date(message.createdAt), { dateStyle: "medium", timeStyle: "short" })}</dd></div>
          </dl>
          <h2 className="card-title pt-2">{t("inbox.message")}</h2>
          <p className="whitespace-pre-wrap">{message.message}</p>
        </Card>
        <div className="grid gap-6 xl:sticky xl:top-6">
          <Card>
            <h2 className="card-title">{t("review")}</h2>
            <MessageStatusForm id={message.id} locale={locale} status={message.status} />
          </Card>
          <Card>
            <h2 className="card-title">{t("dangerZone")}</h2>
            <DeleteEntryForm kind="message" id={message.id} locale={locale} />
          </Card>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run src/i18n/messages.test.ts`
Run: `npx playwright test e2e/apply-and-review.spec.ts e2e/leads.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A src
git commit -m "feat(admin): two-column detail pages with review and delete cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Professions, form builder, settings, set-password

**Files:**
- Modify (rewrite): `src/app/[locale]/admin/(protected)/professions/page.tsx`, `.../professions/new/page.tsx`, `.../professions/[id]/page.tsx`, `.../professions/[id]/form/page.tsx`, `.../settings/page.tsx`, `.../set-password/page.tsx`
- Modify: `src/features/professions/admin-queries.ts` (`AdminProfessionRow.icon`), `src/features/forms/builder/FormBuilder.tsx` (return block), `src/features/forms/builder/FieldList.tsx` (return block)

**Interfaces:**
- Produces: `AdminProfessionRow` gains `icon: string`.

Covered by `e2e/profession-builder.spec.ts` (labels "Slug", "Name (DE)", buttons "Create profession", "Start editing", "Add field", "Save draft", "Publish", combobox "New field type", link "Profession details", text "needs attention", checkbox "Active") and `team.spec.ts` (set-password).

- [ ] **Step 1: Add `icon` to the admin profession rows**

In `src/features/professions/admin-queries.ts`: add `icon: string;` to `AdminProfessionRow`, add `icon` to the `listProfessionsForAdmin` select string (`"id, slug, name, icon, is_active, …"`), and `icon: row.icon,` to the mapped object.

- [ ] **Step 2: Professions list as cards**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import type { FormStatus } from "@/features/professions/admin";
import { listProfessionsForAdmin } from "@/features/professions/admin-queries";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Icon } from "@/ui/Icon";
import { Status, type StatusTone } from "@/ui/Status";

export default async function ProfessionsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, rows] = await Promise.all([getTranslations("admin.professions"), listProfessionsForAdmin()]);
  const statusText = (status: FormStatus) =>
    status.kind === "none" ? t("formStatus.none")
    : status.kind === "draft_only" ? t("formStatus.draftOnly")
    : t(status.draft ? "formStatus.liveWithDraft" : "formStatus.live", { version: status.version });
  const statusTone = (status: FormStatus): StatusTone =>
    status.kind === "none" ? "draft" : status.kind === "draft_only" ? "review" : "ok";
  const newLink = (
    <Link href="/admin/professions/new" className="btn btn-primary btn-sm">
      <Icon name="plus" size={16} />
      {t("new")}
    </Link>
  );

  return (
    <>
      <AdminPageHeader title={t("title")} actions={newLink} />
      {rows.length === 0 ? <Card><EmptyState icon="briefcase" text={t("empty")} /></Card> : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id} className="flex">
              <Card className="w-full gap-4">
                <div className="flex items-start gap-3">
                  <span className="icon-chip icon-chip-navy"><Icon name={row.icon} /></span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/professions/${row.id}`} className="card-title block text-fg no-underline hover:underline">
                      {localized(row.name, locale) || row.slug}
                    </Link>
                    <p className="cell-sub">{t("slug")}: {row.slug}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Status tone={row.isActive ? "ok" : "draft"}>{t("active")}: {row.isActive ? t("yes") : t("no")}</Status>
                  <Status tone={row.isFeatured ? "ok" : "draft"}>{t("featured")}: {row.isFeatured ? t("yes") : t("no")}</Status>
                </div>
                <p className="text-sm text-fg-muted">
                  {t("openPositions")}: {row.openPositions} · {t("sortOrder")}: {row.sortOrder}
                </p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-4">
                  <Status tone={statusTone(row.formStatus)}>{statusText(row.formStatus)}</Status>
                  <Link href={`/admin/professions/${row.id}/form`} className="btn btn-sm">{t("editForm")}</Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
```
- [ ] **Step 3: New and edit profession pages**

`professions/new/page.tsx`:
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { EMPTY_PROFESSION } from "@/features/professions/admin";
import { listIconNames } from "@/features/professions/admin-queries";
import { ProfessionForm } from "@/features/professions/ProfessionForm";
import { Card } from "@/ui/Card";

export default async function NewProfessionPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, icons] = await Promise.all([getTranslations("admin.professions"), listIconNames()]);
  return (
    <>
      <AdminPageHeader title={t("new")} back={{ href: "/admin/professions", label: t("back") }} />
      <Card className="max-w-3xl">
        <ProfessionForm mode="create" locale={locale} icons={icons} values={EMPTY_PROFESSION} />
      </Card>
    </>
  );
}
```

`professions/[id]/page.tsx`:
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { getProfessionForAdmin, listIconNames } from "@/features/professions/admin-queries";
import { DeleteProfessionForm } from "@/features/professions/DeleteProfessionForm";
import { ProfessionForm } from "@/features/professions/ProfessionForm";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";

export default async function EditProfessionPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, icons, profession] = await Promise.all([getTranslations("admin.professions"), listIconNames(), getProfessionForAdmin(id)]);
  if (!profession) notFound();
  const editForm = (
    <Link href={`/admin/professions/${id}/form`} className="btn btn-sm">
      <Icon name="list-checks" size={16} />
      {t("editForm")}
    </Link>
  );

  return (
    <>
      <AdminPageHeader title={profession.values.nameDe} back={{ href: "/admin/professions", label: t("back") }} actions={editForm} />
      <Card className="max-w-3xl">
        <ProfessionForm mode="edit" id={id} locale={locale} icons={icons} values={profession.values} />
      </Card>
      <Card className="max-w-3xl">
        <DeleteProfessionForm id={id} locale={locale} />
      </Card>
    </>
  );
}
```

- [ ] **Step 4: Builder page**

`professions/[id]/form/page.tsx`:
```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { startFormDraft } from "@/features/forms/admin-actions";
import { getBuilderData } from "@/features/forms/admin-queries";
import { FormBuilder } from "@/features/forms/builder/FormBuilder";
import { FormPreview } from "@/features/forms/builder/FormPreview";
import { localized } from "@/lib/i18n/localized";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";

type Props = { params: Promise<{ locale: Locale; id: string }>; searchParams: Promise<{ version?: string }> };

export default async function FormBuilderPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const { version } = await searchParams;
  const [t, format, data] = await Promise.all([getTranslations("admin.forms"), getFormatter(), getBuilderData(id)]);
  if (!data) notFound();
  const viewing = version ? data.versions.find((v) => String(v.version) === version) : undefined;

  return (
    <>
      <AdminPageHeader
        title={t("title", { name: localized(data.profession.name, locale) })}
        back={{ href: `/admin/professions/${id}`, label: t("backToProfession") }}
      />

      {data.draft ? (
        <FormBuilder
          key={data.draft.id}
          locale={locale}
          formId={data.draft.id}
          version={data.draft.version}
          initialDefinition={data.draft.definition}
          initialUpdatedAt={data.draft.updatedAt}
        />
      ) : (
        <>
          <Card className="items-start gap-4">
            <p className="text-fg-muted">{data.live ? t("liveVersion", { version: data.live.version }) : t("noForm")}</p>
            <form action={startFormDraft}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="professionId" value={id} />
              <Button type="submit">{t("startEditing")}</Button>
            </form>
          </Card>
          {data.live ? <Card><FormPreview definition={data.live.definition} initialLocale={locale} /></Card> : null}
        </>
      )}

      <Card>
        <h2 className="card-title">{t("history")}</h2>
        {data.versions.length === 0 ? <p className="muted">{t("noVersions")}</p> : (
          <ul className="grid gap-2">
            {data.versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link href={`/admin/professions/${id}/form?version=${v.version}`} className="font-semibold">{t("versionLabel", { version: v.version })}</Link>
                <span className="muted">{format.dateTime(new Date(v.publishedAt), { dateStyle: "medium", timeStyle: "short" })}</span>
                <span className="muted">{t("applicationCount", { count: v.applications })}</span>
                {v.id === data.live?.id ? <span className="status status-ok">{t("live")}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {viewing ? (
        <Card>
          <h3 className="card-title">{t("versionLabel", { version: viewing.version })}</h3>
          <FormPreview definition={viewing.definition} initialLocale={locale} />
        </Card>
      ) : null}
    </>
  );
}
```

- [ ] **Step 5: Builder components**

In `src/features/forms/builder/FormBuilder.tsx` replace the returned JSX (from `return (` to the matching `);`) with the following, and add `import { Card } from "@/ui/Card";`:
```tsx
  return (
    <Stack gap="lg">
      <Card>
        <h2 className="card-title">{t("draftTitle", { version })}</h2>
        <FieldList
          fields={fields}
          selected={selected}
          locale={locale}
          hasErrors={(i) => hasErrorsUnder(errors, `fields.${i}`)}
          onSelect={setSelected}
          onMove={(i, delta) => update(moveItem(fields, i, delta), selectedAfterMove(selected, i, delta))}
          onRemove={(i) => update(removeAt(fields, i), selectedAfterRemove(selected, i))}
          onAdd={(type) => update([...fields, newField(type, keys)], fields.length)}
        />
      </Card>
      {field && selected !== null ? (
        <Card>
          <FieldEditor
            key={`${selected}-${field.type}`}
            field={field}
            index={selected}
            otherKeys={keys.filter((_, i) => i !== selected)}
            errors={errorsUnder(errors, `fields.${selected}`)}
            onChange={(next) => update(fields.map((f, i) => (i === selected ? next : f)), selected)}
          />
        </Card>
      ) : null}
      {message ? <Text role={message.tone === "success" ? "status" : "alert"} tone={message.tone}>{message.text}</Text> : null}
      <Stack direction="row" gap="sm">
        <Button variant="secondary" disabled={pending} onClick={() => submit("save")}>{t("saveDraft")}</Button>
        <Button disabled={pending} onClick={() => submit("publish")}>{t("publish")}</Button>
        <Button variant="secondary" disabled={pending} onClick={discard}>{t("discardDraft")}</Button>
      </Stack>
      <Card>
        <h2 className="card-title">{t("preview")}</h2>
        <FormPreview definition={definition} initialLocale={locale} />
      </Card>
    </Stack>
  );
```
The only change is the three `Card` wrappers and `card-title` headings; if the current block's props differ from the ones shown (someone changed `FormBuilder` since this plan was written), keep the current props and only add the wrappers.

In `src/features/forms/builder/FieldList.tsx` replace the `fields.map(…)` row markup (the `<li key={i}>…</li>`) with the following and add `import { Icon } from "@/ui/Icon";`:
```tsx
          // Index keys: the answer key is editable, so it cannot identify a row.
          <li key={i} className="builder-row" data-selected={selected === i ? "" : undefined}>
            <Icon name="grip-vertical" size={16} className="text-fg-muted" />
            <button type="button" className="builder-row-main" aria-pressed={selected === i} onClick={() => onSelect(i)}>
              <span className="truncate font-medium">{label}{field.required ? " *" : ""}</span>
              <span className="tag">{t(`types.${field.type}`)}</span>
              {hasErrors(i) ? <span className="text-sm text-error">{t("needsAttention")}</span> : null}
            </button>
            <Button variant="ghost" size="sm" className="btn-icon" aria-label={`${t("moveUp")}: ${label}`} disabled={i === 0} onClick={() => onMove(i, -1)}>
              <Icon name="chevron-down" size={16} className="rotate-180" />
            </Button>
            <Button variant="ghost" size="sm" className="btn-icon" aria-label={`${t("moveDown")}: ${label}`} disabled={i === fields.length - 1} onClick={() => onMove(i, 1)}>
              <Icon name="chevron-down" size={16} />
            </Button>
            <Button variant="danger" size="sm" className="btn-icon" aria-label={`${t("remove")}: ${label}`} onClick={() => onRemove(i)}>
              <Icon name="x" size={16} />
            </Button>
          </li>
```
`Button` adds `max-w-max` when not `block`; that is fine for icon buttons.

- [ ] **Step 6: Settings and set-password**

`settings/page.tsx`:
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireOwner } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { ChatSettingsForm } from "@/features/site-settings/ChatSettingsForm";
import { getChatProvider, getIntegrations } from "@/features/site-settings/queries";
import { tawkMissing } from "@/features/site-settings/settings";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";

export default async function SettingsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireOwner(locale);
  const [t, current] = await Promise.all([getTranslations("admin.settings"), getChatProvider()]);
  const missing = tawkMissing(getIntegrations());

  return (
    <>
      <AdminPageHeader title={t("title")} />
      <Card className="max-w-2xl gap-5">
        {missing.length > 0 ? (
          <Text tone={current === "tawk" ? "danger" : "muted"}>
            {t("tawkNotReady", { missing: missing.map((m) => t(`missing.${m}`)).join(", ") })}
          </Text>
        ) : null}
        <ChatSettingsForm current={current} locale={locale} />
      </Card>
    </>
  );
}
```

`set-password/page.tsx`:
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { SetPasswordForm } from "@/features/admin-auth/SetPasswordForm";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { Card } from "@/ui/Card";

// Inside (protected): an invited editor arrives here already signed in by /api/auth/confirm.
export default async function SetPasswordPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const t = await getTranslations("admin.setPassword");
  return (
    <>
      <AdminPageHeader title={t("title")} />
      <Card className="max-w-lg">
        <SetPasswordForm locale={locale} />
      </Card>
    </>
  );
}
```

- [ ] **Step 7: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Run: `npx playwright test e2e/profession-builder.spec.ts e2e/team.spec.ts`
Expected: PASS. Run `grep -rn '<Stack gap="lg">' "src/app/[locale]/admin/(protected)"` and expect no matches (every admin page starts with `AdminPageHeader`).

- [ ] **Step 8: Commit**

```bash
git add -A src
git commit -m "feat(admin): profession cards, carded form builder, settings and password pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Whole-branch verification

**Files:** none expected; fix anything found in the files concerned and commit those fixes separately.

- [ ] **Step 1: Dead code and leftovers**

```bash
grep -rnE 'Blueprint|kicker|door-|cells|"panel|steps-num|side-count|legal-strip|duotone|logo-light|text-fg-inverse' src || echo clean
```
Expected: `clean`. Remove any remaining reference.

- [ ] **Step 2: Full check**

Run: `npx supabase start` (if not running), then `npm run check` and `npm run test:e2e`
Expected: all green. Paste the summary lines in the PR description.

- [ ] **Step 3: Visual and keyboard pass**

With `npm run dev`, at 375px, 768px and 1280px, in `/de` and `/en`:
- Public: `/`, `/employers`, `/contact`, `/apply/pflege`, a 404 page.
- Admin: login, dashboard, each list (with and without `?status=`), each detail page, professions, builder, team, settings.
Check: no horizontal scroll, no clipped German labels in pills/tabs/badges, gold text only as `gold-700`+, visible focus rings, Tab order reaches the menu button, menu links, drawer links and status tabs; Escape closes both dialogs.

- [ ] **Step 4: Record follow-ups**

Add to `docs/superpowers/plans/2026-10-01-roadmap.md` under follow-ups: "Supply real photos for the five slots in `src/features/site/photos.ts`; client to review the draft home-page copy (`home.features`, `home.trust`)."

```bash
git add docs/superpowers/plans/2026-10-01-roadmap.md
git commit -m "docs(roadmap): note photo and copy follow-ups for the layout overhaul

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
