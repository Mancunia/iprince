-- Plan 2: form drafts and publishing, abandoned-application cleanup.

-- At most one unpublished draft per profession.
create unique index profession_forms_one_draft on public.profession_forms (profession_id) where published_at is null;

-- Returns the profession's draft, creating version N+1 from the live schema if there is none.
-- security invoker: RLS still requires is_admin().
create or replace function public.start_form_draft(p_profession_id uuid) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
begin
  insert into public.profession_forms (profession_id, version, schema)
  select p.id,
         coalesce((select max(f.version) from public.profession_forms f where f.profession_id = p.id), 0) + 1,
         coalesce((select f.schema from public.profession_forms f where f.id = p.current_form_id), '{"fields": []}'::jsonb)
  from public.professions p
  where p.id = p_profession_id
  on conflict (profession_id) where published_at is null do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.profession_forms where profession_id = p_profession_id and published_at is null;
  end if;
  if v_id is null then
    raise exception 'profession not found' using errcode = 'P0002';
  end if;
  return v_id;
end $$;

-- Publishes a draft and makes it the profession's current form, atomically.
-- Raises P0002 when the draft is gone, already published, or changed since the caller loaded it.
create or replace function public.publish_form_draft(p_form_id uuid, p_expected_updated_at timestamptz) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_profession_id uuid;
begin
  update public.profession_forms set published_at = now()
  where id = p_form_id and published_at is null and updated_at = p_expected_updated_at
  returning profession_id into v_profession_id;
  if v_profession_id is null then
    raise exception 'draft is missing or stale' using errcode = 'P0002';
  end if;
  update public.professions set current_form_id = p_form_id where id = v_profession_id;
end $$;

revoke execute on function public.start_form_draft(uuid) from public, anon;
revoke execute on function public.publish_form_draft(uuid, timestamptz) from public, anon;
grant execute on function public.start_form_draft(uuid) to authenticated;
grant execute on function public.publish_form_draft(uuid, timestamptz) to authenticated;

-- Uploads older than the cutoff that no submitted application references.
create or replace function public.orphaned_application_objects(p_cutoff timestamptz, p_limit int) returns setof text
language sql stable security definer set search_path = '' as $$
  select o.name from storage.objects o
  where o.bucket_id = 'applications'
    and o.created_at < p_cutoff
    and not exists (select 1 from public.application_files f where f.storage_path = o.name)
  order by o.created_at
  limit p_limit;
$$;

-- Applications that were started but never finalized before the cutoff.
create or replace function public.delete_abandoned_applications(p_cutoff timestamptz) returns int
language sql security definer set search_path = '' as $$
  with deleted as (
    delete from public.applications where submitted_at is null and created_at < p_cutoff returning 1
  )
  select count(*)::int from deleted;
$$;

revoke execute on function public.orphaned_application_objects(timestamptz, int) from public, anon, authenticated;
revoke execute on function public.delete_abandoned_applications(timestamptz) from public, anon, authenticated;
grant execute on function public.orphaned_application_objects(timestamptz, int) to service_role;
grant execute on function public.delete_abandoned_applications(timestamptz) to service_role;
