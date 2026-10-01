# 2c: Blog

Date: 2026-10-01 · Branch: `feat/blog` · Parent specs: `2026-09-30-foundation-design.md`, roadmap `plans/2026-10-01-roadmap.md` (2c)

## Goal
Staff write, schedule and publish bilingual posts (markdown, cover image, category) without SQL. Visitors browse `/blog` with a category filter and read `/blog/[slug]`; each post ends with a call to action chosen by its category (candidates → apply, employers → employers page). An admin-authored post can never inject script.

The tables `blog_categories` and `blog_posts`, their RLS (anon reads `published and published_at <= now()`), the admin policies and the public `blog` bucket already exist. 2c adds one migration, a `features/blog/` domain, admin and public routes, and tests.

## Decisions
| Topic | Decision |
|---|---|
| Audience | Both candidates and employers; the category's `cta` decides the post's call to action |
| Volume | A few posts a month → 9 per page, simple pagination |
| Editor | Plain textarea with Write/Preview toggle and a cheat-sheet; preview uses the public renderer |
| Renderer | Reuse the existing `src/ui/Markdown.tsx` (added for the legal pages): `react-markdown` + `remark-gfm`, `skipHtml`, allow-list `safeUrl`; no `rehype-raw`, no `dangerouslySetInnerHTML`. 2c extends it (see §4) instead of adding a second renderer |
| Slugs | One slug per post shared by de/en (author writes it in German) |
| Missing English | Fall back to German with an "only available in German" note |
| Scheduling | Status `published` + future `published_at` = scheduled; enforced by existing RLS, no cron |
| Featured | Newest featured live post is the `/blog` hero; flags are independent |
| Permissions | Owner and editors: everything in the blog |
| Out of scope | Comments, tags, RSS, search, view counts, per-locale slugs, rich-text editor, inline body uploads, revision history; post sitemap entries go to 2e |

## 1. Data and storage

**Migration `20261001000004_blog.sql`:**
- `create type public.blog_cta as enum ('candidates', 'employers', 'none')`;
  `alter table public.blog_categories add column cta public.blog_cta not null default 'none'`.
- `create index blog_posts_live_idx on public.blog_posts (status, published_at desc)`.
- `alter table public.blog_posts add constraint blog_posts_published_has_date check (status = 'draft' or published_at is not null)`.

**Seed:** `karriere` gets `cta = 'candidates'`; add `arbeitgeber` (`{"de":"Arbeitgeber","en":"Employers"}`, `cta = 'employers'`).

**Unchanged:** single `slug`; `title`, `excerpt`, `body` as `{de, en}` jsonb (title `de` required).

**Post states** (derived, never stored): `draft` (status draft), `scheduled` (published, `published_at > now()`), `live` (published, `published_at <= now()`). Publishing with an empty date sets `published_at = now()`. The admin enters date/time in Europe/Berlin; it is stored as UTC.

**Covers:** public bucket `blog`, path `posts/<postId>/<uuid>.<jpg|png|webp>`, max 5 MB (bucket limit). The browser uploads as the admin (existing `blog bucket: admins write` policy); a server action verifies the object exists under that post's folder, records `cover_path`, then deletes the previous file. Removing a cover deletes the file; deleting a post removes its folder. `next.config.ts` adds a `remotePatterns` entry for `/storage/v1/object/public/blog/**`. Without a cover, cards show a branded placeholder.

**Category delete:** existing `on delete set null`; posts become uncategorized (no CTA). The delete card shows the number of affected posts.

## 2. Admin

**Nav:** "Blog" (icon `book-open`) in the *Setup* group after Content.

**Routes** (`src/app/[locale]/admin/(protected)/blog/`):
- `page.tsx`: post list with `StatusTabs` All / Drafts / Scheduled / Published (= live). Row: title (de), category, state badge, date, featured star. "New post" and "Categories" links.
- `new/page.tsx`, `[id]/page.tsx`: two-column page.
  - Main: de/en tab switcher; per locale title, excerpt (textarea, ~200 chars, used on cards and as meta description), body (`MarkdownField`). Both locales are in one form and saved together.
  - Side cards: **Publish** (status, Berlin date-time, featured), **Details** (slug auto-filled from the de title until edited by hand, category, author name defaulting to `iPrince`), **Cover** (`CoverField`, only after the post exists), **Delete** (confirm), "View on site" when live.
- `categories/page.tsx`: category list, inline create/edit form (slug, name de/en, CTA select), delete card with affected-post count.

**`src/features/blog/`:**
- `schema.ts`: zod for post and category form data; slug regex as in the DB; de title required; trims; excerpt ≤ 300 chars.
- `publish.ts`: `postState(status, publishedAt, now)`, `berlinInputToUtc(value)`, `utcToBerlinInput(iso)`, `resolvePublishedAt(status, input, now)`.
- `admin-queries.ts` (server-only): `listPosts(state?)`, `getPost(id)`, `listCategories()` (with post counts), `getCategory(id)`.
- `admin-actions.ts` (`'use server'`): `createPost`, `updatePost`, `deletePost`, `setPostCover`, `removePostCover`, `createCategory`, `updateCategory`, `deleteCategory`. Each: `requireAdmin(locale)`, zod parse, Supabase write, `23505` on slug → field error `slug: taken`, other errors → form error; `revalidatePath` for the admin blog layout and `/de/blog`, `/en/blog` (layout).
- UI: `PostForm.tsx` (client; language and Write/Preview toggles follow `site-content/LegalForm.tsx`, preview uses `ui/Markdown`; renders the side cards and an `aside` slot), `CoverField.tsx` (client, mirrors `site-content/PhotosEditor.tsx`), `DeletePostButton.tsx`, `CategoryForm.tsx`, `DeleteCategoryForm.tsx`. Cover and delete controls sit inside the post `<form>`'s side column, so they call their actions from buttons (no nested `<form>`).

## 3. Public pages

**`src/app/[locale]/(site)/blog/page.tsx`:**
- Header (eyebrow, title, lead; `blog.*` messages de/en).
- `CategoryChips`: "All" plus categories with live posts; links set `?category=<slug>`. Unknown category → empty state.
- `FeaturedPost` hero on page 1 without a filter (newest featured live post), excluded from the grid.
- Grid of `PostCard` (cover or placeholder, category badge, title, excerpt, localized date, reading time), 9 per page, newest `published_at` first.
- `Pagination` with `?page=n`; page < 1 or beyond the last page (when posts exist) → 404.

**`src/app/[locale]/(site)/blog/[slug]/page.tsx`:**
- Back link, category badge, title, date, reading time, author, cover via `next/image` (`priority`, responsive `sizes`), body in `<Markdown>`.
- Locale fallback: if the requested locale's title or body is empty, use de for both and show the note; the content wrapper gets `lang="de"`.
- `PostCta` by category `cta`: `candidates` → link to `/#berufe`; `employers` → `/employers`; `none`/no category → nothing.
- Up to 3 related live posts from the same category, hidden when none.
- `generateMetadata`: title, excerpt description, canonical, `alternates.languages` de/en (same slug), Open Graph `article` with `publishedTime` and the cover image (default `/logo/iprince-mark.png`).
- Next 16 fails the build on relative metadata URLs without `metadataBase`, so `src/app/[locale]/layout.tsx` sets `metadataBase` from a tested `src/lib/site-url.ts` (production domain on Vercel production, deployment URL on previews, `http://localhost:3000` locally).
- Unknown, draft or scheduled slug → `notFound()`.

**`src/features/blog/queries.ts`** (server-only, explicit `status = 'published'` and `published_at <= now` filters in addition to RLS): `listLivePosts({ category?, page, excludeId? })` returning rows plus total, `getFeaturedPost()`, `getLivePost(slug)`, `listRelated(categoryId, excludeId)`, `listUsedCategories()`.

**Pure helpers:** `reading-time.ts` (words / 200, minimum 1), `text.ts` `localizePost(post, locale)` returning the text and a `fallback` flag, `paging.ts` (`?page=` parsing, page count, row range).

**Covers on cards:** `features/site/Photo.tsx` gains an optional `icon` prop so blog placeholders show `book-open` instead of `user`. Dates are formatted with `timeZone: "Europe/Berlin"` (next-intl has no global time zone configured).

**Site chrome:** "Blog" link in `SiteHeader`, `MobileNav` and `SiteFooter`.

**Rendering:** dynamic per request like the rest of the site, so scheduled posts go live on time.

## 4. Markdown safety

The blog reuses `src/ui/Markdown.tsx` (also used by the legal pages and `LegalForm` preview), which already has:
- `react-markdown` with `remarkPlugins={[remarkGfm]}`, `skipHtml`, no rehype plugins;
- `safeUrl` as `urlTransform`: keeps `http:`, `https:`, `mailto:`, `tel:`, scheme-less (relative, `#anchor`) URLs; anything else → `""`;
- tests for `<script>`, `onerror`, `javascript:`, `data:` and `vbscript:`.

2c adds `components` to it (legal pages benefit too): `h1` rendered as `h2`; external (`http(s):`) links `target="_blank" rel="noopener noreferrer"`; `img` lazy-loaded, rendered only with a non-empty (safe) `src` (plain `<img>`, any host); tables wrapped in an `overflow-x-auto` container. Styles: the existing `.prose` class in `src/styles/components.css` gains `h4`, `blockquote`, `img`, `code`, `pre` and `hr` rules from design-system tokens.

## 5. Errors
- Actions return `ActionResult` (`fieldErrors` for validation and slug clash, `formError` otherwise); forms keep entered values on failure.
- Failed cover upload: form error, post untouched; the orphaned object (if any) is removed by the client on failure.
- Admin pages: missing id → 404. Public pages: query errors throw to `error.tsx`; hidden or unknown slugs → 404.

## 6. Testing
- **Vitest** (`.test.ts`, `renderToStaticMarkup` without JSX):
  - `Markdown` (existing safety tests kept): `h1` → `h2`; external link gets `target` and `rel`, internal does not; images lazy, unsafe image `src` dropped; tables wrapped.
  - `schema` (incl. `slugify`), `publish` (states, Berlin conversion across DST change), `reading-time`, `text` (`localizePost`), `paging`, `cover`, `site-url`.
- **pgTAP** `supabase/tests/database/blog.test.sql`: anon cannot see draft or future-dated posts and can see live ones; anon cannot insert/update/delete posts or categories; anon cannot write to bucket `blog`, an admin can; the published-date check constraint; `cta` default.
- **Playwright** `e2e/blog.spec.ts`: admin creates a candidates-CTA category, a de post with cover, publishes it; it shows on `/de/blog` and the post page shows body and CTA; `/en/blog/<slug>` shows the fallback note; a draft URL is 404 when logged out; a future-scheduled post is not listed; the category filter narrows the list.
- `npm run db:types` after the migration; `npm run check` passes.

## Acceptance (from the roadmap)
- Drafts and scheduled posts are invisible to anon (pgTAP + e2e).
- The renderer strips `<script>`, event handlers and `javascript:` links (unit test).
- Covers use `next/image`.
- Posts have `generateMetadata` with an OG image.
