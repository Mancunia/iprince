-- 2c blog: each category decides the call to action under its posts.
create type public.blog_cta as enum ('candidates', 'employers', 'none');
alter table public.blog_categories add column cta public.blog_cta not null default 'none';

-- A published post always has a date; a future date means scheduled (RLS hides it until then).
alter table public.blog_posts
  add constraint blog_posts_published_has_date check (status = 'draft' or published_at is not null);

-- Public listing: live posts, newest first.
create index blog_posts_live_idx on public.blog_posts (status, published_at desc);
