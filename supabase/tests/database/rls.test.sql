begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

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
select throws_ok($$select public.finalize_application('40000000-0000-0000-0000-000000000001', '[]')$$, '42501', null, 'anon cannot call finalize_application');
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
select is(
  public.finalize_application('40000000-0000-0000-0000-000000000001',
    '[{"field_key":"cv","storage_path":"40000000-0000-0000-0000-000000000001/cv/a.pdf","mime":"application/pdf","size":10}]'),
  true, 'finalize returns true on first call');
select is((select count(*)::int from public.application_files where application_id = '40000000-0000-0000-0000-000000000001'), 1, 'finalize inserts the file row');
select is(
  public.finalize_application('40000000-0000-0000-0000-000000000001',
    '[{"field_key":"cv","storage_path":"40000000-0000-0000-0000-000000000001/cv/b.pdf","mime":"application/pdf","size":10}]'),
  false, 'second finalize returns false');
select is((select count(*)::int from public.application_files where application_id = '40000000-0000-0000-0000-000000000001'), 1, 'second finalize attaches nothing');
reset role;

select * from finish();
rollback;
