-- Sample professions for local development. Admins manage the real ones.
insert into public.professions (id, slug, name, summary, icon, is_featured, is_active, sort_order, open_positions) values
  ('a0000000-0000-4000-8000-000000000001', 'pflege',
   '{"de":"Pflege & Gesundheit","en":"Nursing & healthcare"}',
   '{"de":"Pflegefachkräfte für Kliniken und Einrichtungen.","en":"Registered nurses for hospitals and care homes."}',
   'heart-handshake', true, true, 1, 24),
  ('a0000000-0000-4000-8000-000000000002', 'elektro',
   '{"de":"Elektro- und Anlagentechnik","en":"Electrical & plant engineering"}',
   '{"de":"Elektroniker:innen und Anlagenmechaniker:innen.","en":"Electricians and plant mechanics."}',
   'zap', true, true, 2, 11);

insert into public.profession_forms (id, profession_id, version, published_at, schema) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 1, now(), '{
    "fields": [
      {"key":"german_level","type":"language_level","required":true,"label":{"de":"Deutschniveau","en":"German level"}},
      {"key":"experience_years","type":"number","required":true,"label":{"de":"Berufserfahrung (Jahre)","en":"Years of experience"}},
      {"key":"specialisation","type":"select","required":true,"label":{"de":"Fachbereich","en":"Specialisation"},
       "options":[{"value":"intensive","label":{"de":"Intensivpflege","en":"Intensive care"}},
                  {"value":"general","label":{"de":"Allgemeine Pflege","en":"General nursing"}},
                  {"value":"geriatric","label":{"de":"Altenpflege","en":"Geriatric care"}}]},
      {"key":"recognition_started","type":"checkbox","required":false,"label":{"de":"Anerkennungsverfahren bereits begonnen","en":"Recognition process already started"}},
      {"key":"motivation","type":"textarea","required":false,"label":{"de":"Motivation","en":"Motivation"}},
      {"key":"cv","type":"file","required":true,"accept":["application/pdf"],"maxSizeMb":10,"label":{"de":"Lebenslauf (PDF)","en":"CV (PDF)"}}
    ]}'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 1, now(), '{
    "fields": [
      {"key":"german_level","type":"language_level","required":true,"label":{"de":"Deutschniveau","en":"German level"}},
      {"key":"trade","type":"radio","required":true,"label":{"de":"Beruf","en":"Trade"},
       "options":[{"value":"electrician","label":{"de":"Elektroniker:in","en":"Electrician"}},
                  {"value":"mechanic","label":{"de":"Anlagenmechaniker:in","en":"Plant mechanic"}}]},
      {"key":"certificates","type":"file","required":false,"accept":["application/pdf","image/*"],"maxSizeMb":10,"label":{"de":"Zeugnisse","en":"Certificates"}}
    ]}');

update public.professions set current_form_id = 'b0000000-0000-4000-8000-000000000001' where slug = 'pflege';
update public.professions set current_form_id = 'b0000000-0000-4000-8000-000000000002' where slug = 'elektro';

insert into public.blog_categories (slug, name) values ('karriere', '{"de":"Karriere","en":"Careers"}');
