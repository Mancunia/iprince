insert into storage.buckets (id, name, public, file_size_limit)
values ('applications', 'applications', false, 20971520),
       ('blog', 'blog', true, 5242880)
on conflict (id) do nothing;

-- Applicant uploads use service-role signed upload URLs, so there is no public insert policy.
create policy "applications bucket: admins read" on storage.objects
  for select to authenticated using (bucket_id = 'applications' and (select public.is_admin()));
create policy "applications bucket: admins delete" on storage.objects
  for delete to authenticated using (bucket_id = 'applications' and (select public.is_admin()));
create policy "blog bucket: admins write" on storage.objects
  for all to authenticated
  using (bucket_id = 'blog' and (select public.is_admin()))
  with check (bucket_id = 'blog' and (select public.is_admin()));

-- Lets finalizeApplication verify what was actually uploaded (real size and MIME).
create or replace function public.storage_object_meta(p_bucket text, p_path text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select metadata from storage.objects where bucket_id = p_bucket and name = p_path;
$$;
revoke execute on function public.storage_object_meta(text, text) from public, anon, authenticated;
grant execute on function public.storage_object_meta(text, text) to service_role;
