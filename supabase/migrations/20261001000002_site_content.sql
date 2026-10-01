-- 2d: editable site content. Copy is for all admins, legal pages for the owner only.
drop policy site_content_admin_all on public.site_content;

create policy site_content_admin_copy on public.site_content
  for all to authenticated
  using ((select public.is_admin()) and key not like 'legal.%')
  with check ((select public.is_admin()) and key not like 'legal.%');

create policy site_content_owner_legal on public.site_content
  for all to authenticated
  using ((select public.is_owner()) and key like 'legal.%')
  with check ((select public.is_owner()) and key like 'legal.%');

-- Keep in step with CONTENT_KEYS in src/features/site-content/content.ts.
alter table public.site_content add constraint site_content_key_known check (key in (
  'home.hero', 'home.features', 'home.steps', 'home.employers', 'contact', 'photos', 'legal.imprint', 'legal.privacy'));

-- Site photos. Storage enforces size and type on upload, so the server action only checks the path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site', 'site', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "site bucket: admins write" on storage.objects
  for all to authenticated
  using (bucket_id = 'site' and (select public.is_admin()))
  with check (bucket_id = 'site' and (select public.is_admin()));
