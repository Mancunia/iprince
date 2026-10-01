begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('13000000-0000-0000-0000-000000000001', 'sc-owner@test.local'),
  ('13000000-0000-0000-0000-000000000002', 'sc-editor@test.local');
insert into public.admins (user_id, role, display_name) values
  ('13000000-0000-0000-0000-000000000001', 'owner', 'Owner'),
  ('13000000-0000-0000-0000-000000000002', 'editor', 'Editor');
delete from public.site_content where key in ('home.hero', 'legal.privacy');
insert into public.site_content (key, value) values
  ('home.hero', '{"v":"seed"}'),
  ('legal.privacy', '{"v":"seed"}');

select throws_ok($$insert into public.site_content (key, value) values ('home.unknown', '{}')$$, '23514', null, 'unknown keys are rejected');

set local role anon;
select is((select count(*)::int from public.site_content where key in ('home.hero', 'legal.privacy')), 2, 'anon reads all content');
update public.site_content set value = '{"v":"anon"}' where key = 'home.hero';
select throws_ok($$insert into public.site_content (key, value) values ('contact', '{}')$$, '42501', null, 'anon cannot insert');
reset role;
select is((select value->>'v' from public.site_content where key = 'home.hero'), 'seed', 'anon cannot update');

set local role authenticated;
set local request.jwt.claims = '{"sub":"13000000-0000-0000-0000-000000000002","role":"authenticated"}';
update public.site_content set value = '{"v":"editor"}' where key = 'home.hero';
update public.site_content set value = '{"v":"editor"}' where key = 'legal.privacy';
select throws_ok($$insert into public.site_content (key, value) values ('legal.imprint', '{}') on conflict (key) do update set value = excluded.value$$, '42501', null, 'an editor cannot write legal rows');
reset role;
select is((select value->>'v' from public.site_content where key = 'home.hero'), 'editor', 'an editor can update copy');
select is((select value->>'v' from public.site_content where key = 'legal.privacy'), 'seed', 'an editor cannot update legal rows');

set local role authenticated;
set local request.jwt.claims = '{"sub":"13000000-0000-0000-0000-000000000001","role":"authenticated"}';
update public.site_content set value = '{"v":"owner"}' where key = 'legal.privacy';
reset role;
select is((select value->>'v' from public.site_content where key = 'legal.privacy'), 'owner', 'the owner can update legal rows');

set local role anon;
select throws_ok($$insert into storage.objects (bucket_id, name) values ('site', 'hero/x.jpg')$$, '42501', null, 'anon cannot upload to site');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"13000000-0000-0000-0000-000000000002","role":"authenticated"}';
select lives_ok($$insert into storage.objects (bucket_id, name) values ('site', 'hero/00000000-0000-0000-0000-000000000000.jpg')$$, 'an admin can upload to site');
reset role;

select * from finish();
rollback;
