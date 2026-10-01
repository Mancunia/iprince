begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- Fixtures (postgres bypasses RLS)
insert into auth.users (id, email) values
  ('12000000-0000-0000-0000-000000000001', 'ss-owner@test.local'),
  ('12000000-0000-0000-0000-000000000002', 'ss-editor@test.local');
insert into public.admins (user_id, role, display_name) values
  ('12000000-0000-0000-0000-000000000001', 'owner', 'Owner'),
  ('12000000-0000-0000-0000-000000000002', 'editor', 'Editor');

select is((select chat_provider from public.site_settings), 'whatsapp', 'defaults to WhatsApp');
select throws_ok($$insert into public.site_settings (id) values (false)$$, '23514', null, 'only the single row can exist');
select throws_ok($$update public.site_settings set chat_provider = 'telegram'$$, '23514', null, 'unknown providers are rejected');

set local role anon;
select is((select chat_provider from public.site_settings), 'whatsapp', 'anon can read the settings');
update public.site_settings set chat_provider = 'none';
reset role;
select is((select chat_provider from public.site_settings), 'whatsapp', 'anon cannot change the settings');

set local role authenticated;
set local request.jwt.claims = '{"sub":"12000000-0000-0000-0000-000000000002","role":"authenticated"}';
update public.site_settings set chat_provider = 'none';
reset role;
select is((select chat_provider from public.site_settings), 'whatsapp', 'an editor cannot change the settings');

set local role authenticated;
set local request.jwt.claims = '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}';
update public.site_settings set chat_provider = 'tawk';
delete from public.site_settings;
reset role;
select is((select count(*)::int from public.site_settings), 1, 'the owner cannot delete the row');
select is((select chat_provider from public.site_settings), 'tawk', 'the owner can change the provider');

select * from finish();
rollback;
