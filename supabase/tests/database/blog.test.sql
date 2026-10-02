begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Fixtures (postgres bypasses RLS)
insert into auth.users (id, email) values
  ('14000000-0000-0000-0000-000000000001', 'blog-editor@test.local'),
  ('14000000-0000-0000-0000-000000000002', 'blog-nobody@test.local');
insert into public.admins (user_id, role, display_name) values
  ('14000000-0000-0000-0000-000000000001', 'editor', 'Editor');
insert into public.blog_categories (id, slug, name) values
  ('14000000-0000-0000-0000-0000000000c1', 'test-cat', '{"de":"Test"}');
insert into public.blog_posts (id, slug, title, status, published_at) values
  ('14000000-0000-0000-0000-0000000000a1', 'test-live', '{"de":"Live"}', 'published', now() - interval '1 day'),
  ('14000000-0000-0000-0000-0000000000a2', 'test-scheduled', '{"de":"Geplant"}', 'published', now() + interval '1 day'),
  ('14000000-0000-0000-0000-0000000000a3', 'test-draft-dated', '{"de":"Entwurf"}', 'draft', now() - interval '1 day');

-- Schema
select is((select cta::text from public.blog_categories where slug = 'test-cat'), 'none', 'categories default to no call to action');
select throws_ok(
  $$insert into public.blog_posts (slug, title, status) values ('test-no-date', '{"de":"X"}', 'published')$$,
  '23514', null, 'a published post needs a date');

-- Visitor
set local role anon;
select is((select count(*)::int from public.blog_posts where slug = 'test-live'), 1, 'anon reads a live post');
select is_empty($$select id from public.blog_posts where slug = 'test-scheduled'$$, 'anon cannot read a scheduled post');
select is_empty($$select id from public.blog_posts where slug = 'test-draft-dated'$$, 'anon cannot read a draft, even with a past date');
select throws_ok($$insert into public.blog_posts (slug, title) values ('anon-post', '{"de":"X"}')$$, '42501', null, 'anon cannot insert posts');
select throws_ok($$insert into public.blog_categories (slug, name) values ('anon-cat', '{"de":"X"}')$$, '42501', null, 'anon cannot insert categories');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('blog', 'posts/x/y.jpg')$$, '42501', null, 'anon cannot upload to blog');
-- No update/delete policy for anon: these silently touch zero rows.
update public.blog_posts set slug = 'anon-renamed' where id = '14000000-0000-0000-0000-0000000000a1';
delete from public.blog_categories where id = '14000000-0000-0000-0000-0000000000c1';
reset role;
select is((select slug from public.blog_posts where id = '14000000-0000-0000-0000-0000000000a1'), 'test-live', 'anon cannot update posts');
select isnt_empty($$select id from public.blog_categories where id = '14000000-0000-0000-0000-0000000000c1'$$, 'anon cannot delete categories');

-- Signed-in non-admin
set local role authenticated;
set local request.jwt.claims = '{"sub":"14000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok($$insert into public.blog_posts (slug, title) values ('user-post', '{"de":"X"}')$$, '42501', null, 'a non-admin cannot insert posts');
reset role;

-- Editor
set local role authenticated;
set local request.jwt.claims = '{"sub":"14000000-0000-0000-0000-000000000001","role":"authenticated"}';
select lives_ok($$insert into public.blog_posts (slug, title) values ('editor-post', '{"de":"X"}')$$, 'an editor creates posts');
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('blog', 'posts/14000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-000000000000.jpg')$$,
  'an editor uploads covers');
select is((select count(*)::int from public.blog_posts where slug = 'test-scheduled'), 1, 'an editor reads scheduled posts');
reset role;

select * from finish();
rollback;
