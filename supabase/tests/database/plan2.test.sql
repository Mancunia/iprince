begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

-- Fixtures (postgres bypasses RLS)
insert into auth.users (id, email) values
  ('11000000-0000-0000-0000-000000000001', 'p2-owner@test.local'),
  ('11000000-0000-0000-0000-000000000002', 'p2-editor@test.local');
insert into public.admins (user_id, role, display_name) values
  ('11000000-0000-0000-0000-000000000001', 'owner', 'Owner'),
  ('11000000-0000-0000-0000-000000000002', 'editor', 'Editor');

insert into public.professions (id, slug, name) values
  ('21000000-0000-0000-0000-000000000001', 'p2-with-form', '{"de":"Mit Formular","en":""}'),
  ('21000000-0000-0000-0000-000000000002', 'p2-empty', '{"de":"Leer","en":""}');
insert into public.profession_forms (id, profession_id, version, schema, published_at) values
  ('31000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 1,
   '{"fields":[{"key":"q","type":"text","label":{"de":"Frage","en":""},"required":false}]}', now());
update public.professions set current_form_id = '31000000-0000-0000-0000-000000000001'
  where id = '21000000-0000-0000-0000-000000000001';

insert into public.applications (id, profession_id, form_id, full_name, email, locale, created_at, submitted_at) values
  ('41000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001',
   'Old Draft', 'a@test.local', 'en', now() - interval '25 hours', null),
  ('41000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001',
   'Fresh Draft', 'b@test.local', 'en', now() - interval '1 hour', null),
  ('41000000-0000-0000-0000-000000000003', '21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001',
   'Submitted', 'c@test.local', 'en', now() - interval '30 hours', now() - interval '30 hours');
insert into public.application_files (application_id, field_key, storage_path, mime, size) values
  ('41000000-0000-0000-0000-000000000003', 'cv', '41000000-0000-0000-0000-000000000003/cv/x.pdf', 'application/pdf', 10);
insert into storage.objects (bucket_id, name, created_at) values
  ('applications', '41000000-0000-0000-0000-000000000001/cv/a.pdf', now() - interval '25 hours'),
  ('applications', '41000000-0000-0000-0000-000000000002/cv/b.pdf', now() - interval '1 hour'),
  ('applications', '41000000-0000-0000-0000-000000000003/cv/x.pdf', now() - interval '30 hours'),
  ('blog', 'old-cover.png', now() - interval '30 hours');

-- Cleanup functions are service-role only
set local role anon;
select throws_ok($$select public.orphaned_application_objects(now(), 10)$$, '42501', null, 'anon cannot list orphaned objects');
select throws_ok($$select public.start_form_draft('21000000-0000-0000-0000-000000000001')$$, '42501', null, 'anon cannot start a draft');
select throws_ok($$select public.publish_form_draft('31000000-0000-0000-0000-000000000001', now())$$, '42501', null, 'anon cannot publish');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok($$select public.delete_abandoned_applications(now())$$, '42501', null, 'editor cannot run the cleanup');
reset role;

set local role service_role;
select is(
  array(select public.orphaned_application_objects(now() - interval '24 hours', 100)),
  array['41000000-0000-0000-0000-000000000001/cv/a.pdf']::text[],
  'only old, unreferenced objects in the applications bucket are orphaned');
select is(public.delete_abandoned_applications(now() - interval '24 hours'), 1, 'deletes one abandoned application');
reset role;
select is((select count(*)::int from public.applications where id = '41000000-0000-0000-0000-000000000001'), 0, 'old unsubmitted application is gone');
select is((select count(*)::int from public.applications where id = '41000000-0000-0000-0000-000000000002'), 1, 'fresh unsubmitted application stays');
select is((select count(*)::int from public.applications where id = '41000000-0000-0000-0000-000000000003'), 1, 'submitted application stays');

-- Drafts and publishing, as an editor
set local role authenticated;
set local request.jwt.claims = '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}';
select set_config('test.draft', public.start_form_draft('21000000-0000-0000-0000-000000000001')::text, true);
select is((select version from public.profession_forms where id = current_setting('test.draft')::uuid), 2, 'draft is version 2');
select is((select schema from public.profession_forms where id = current_setting('test.draft')::uuid),
  (select schema from public.profession_forms where id = '31000000-0000-0000-0000-000000000001'), 'draft copies the live schema');
select is(public.start_form_draft('21000000-0000-0000-0000-000000000001'), current_setting('test.draft')::uuid, 'starting again returns the same draft');
select throws_ok(
  $$insert into public.profession_forms (profession_id, version, schema) values ('21000000-0000-0000-0000-000000000001', 9, '{"fields":[]}')$$,
  '23505', null, 'a second draft for the same profession is rejected');
select throws_ok(
  format($$select public.publish_form_draft(%L, '2000-01-01T00:00:00Z')$$, current_setting('test.draft')),
  'P0002', null, 'publish with a stale updated_at raises P0002');
select lives_ok(
  format($$select public.publish_form_draft(%L, %L)$$, current_setting('test.draft'),
    (select updated_at from public.profession_forms where id = current_setting('test.draft')::uuid)),
  'publish with the current updated_at succeeds');
select is((select current_form_id from public.professions where id = '21000000-0000-0000-0000-000000000001'),
  current_setting('test.draft')::uuid, 'publishing moves current_form_id');
select set_config('test.draft2', public.start_form_draft('21000000-0000-0000-0000-000000000002')::text, true);
select is((select schema from public.profession_forms where id = current_setting('test.draft2')::uuid),
  '{"fields": []}'::jsonb, 'a profession without forms gets an empty draft');

-- Deleting professions
select throws_ok($$delete from public.professions where id = '21000000-0000-0000-0000-000000000001'$$, '23503', null,
  'a profession with applications cannot be deleted');
delete from public.professions where id = '21000000-0000-0000-0000-000000000002';
select is((select count(*)::int from public.profession_forms where profession_id = '21000000-0000-0000-0000-000000000002'), 0,
  'deleting a profession without applications removes its forms');
reset role;

select * from finish();
rollback;
