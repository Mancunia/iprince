begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Fixtures (postgres bypasses RLS)
insert into auth.users (id, email) values
  ('13000000-0000-0000-0000-000000000001', 'leads-editor@test.local'),
  ('13000000-0000-0000-0000-000000000002', 'leads-nobody@test.local');
insert into public.admins (user_id, role, display_name) values
  ('13000000-0000-0000-0000-000000000001', 'editor', 'Editor');
insert into public.employer_leads (id, company, contact_name, email) values
  ('13000000-0000-0000-0000-0000000000a1', 'ACME', 'Erika', 'erika@test.local');
insert into public.contact_messages (id, name, email, message) values
  ('13000000-0000-0000-0000-0000000000b1', 'Max', 'max@test.local', 'Hallo');

set local role anon;
select is_empty($$select id from public.employer_leads$$, 'anon cannot read enquiries');
select is_empty($$select id from public.contact_messages$$, 'anon cannot read messages');
select throws_ok($$insert into public.employer_leads (company, contact_name, email) values ('x', 'y', 'z@test.local')$$, '42501', null, 'anon cannot insert enquiries');
select throws_ok($$insert into public.contact_messages (name, email, message) values ('x', 'z@test.local', 'm')$$, '42501', null, 'anon cannot insert messages');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"13000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is_empty($$select id from public.employer_leads$$, 'a non-admin cannot read enquiries');
select is_empty($$select id from public.contact_messages$$, 'a non-admin cannot read messages');
select throws_ok($$insert into public.contact_messages (name, email, message) values ('x', 'z@test.local', 'm')$$, '42501', null, 'a non-admin cannot insert messages');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"13000000-0000-0000-0000-000000000001","role":"authenticated"}';
select isnt_empty($$select id from public.employer_leads$$, 'an editor reads enquiries');
select isnt_empty($$select id from public.contact_messages$$, 'an editor reads messages');
update public.employer_leads set status = 'contacted', admin_notes = 'called' where id = '13000000-0000-0000-0000-0000000000a1';
delete from public.contact_messages where id = '13000000-0000-0000-0000-0000000000b1';
reset role;

select is((select status::text from public.employer_leads where id = '13000000-0000-0000-0000-0000000000a1'), 'contacted', 'an editor updates enquiries');
select is_empty($$select id from public.contact_messages where id = '13000000-0000-0000-0000-0000000000b1'$$, 'an editor deletes messages');

select * from finish();
rollback;
