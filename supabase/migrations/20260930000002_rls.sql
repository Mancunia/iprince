create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()) and role = 'owner');
$$;

do $$
declare t text;
begin
  foreach t in array array['admins', 'professions', 'profession_forms', 'applications', 'application_files',
    'employer_leads', 'contact_messages', 'blog_categories', 'blog_posts', 'reviews', 'site_content', 'rate_limits'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  -- Admins (owner or editor) get full access to everything except the admins table itself.
  foreach t in array array['professions', 'profession_forms', 'applications', 'application_files',
    'employer_leads', 'contact_messages', 'blog_categories', 'blog_posts', 'reviews', 'site_content'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      t || '_admin_all', t);
  end loop;
end $$;

create policy admins_admin_read on public.admins
  for select to authenticated using ((select public.is_admin()));
create policy admins_owner_write on public.admins
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

-- Public reads. There are no public insert policies: submissions go through server actions using the service role.
create policy professions_public_read on public.professions
  for select to anon, authenticated using (is_active);
create policy profession_forms_public_read on public.profession_forms
  for select to anon, authenticated using (
    exists (select 1 from public.professions p where p.current_form_id = profession_forms.id and p.is_active)
  );
create policy blog_categories_public_read on public.blog_categories
  for select to anon, authenticated using (true);
create policy blog_posts_public_read on public.blog_posts
  for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy reviews_public_read on public.reviews
  for select to anon, authenticated using (status = 'approved');
create policy site_content_public_read on public.site_content
  for select to anon, authenticated using (true);
-- rate_limits: no policies (only the service role, which bypasses RLS, touches it).
