-- Atomically marks an application submitted and attaches its files.
-- Returns false when the application was already finalized (concurrent/retry).
create or replace function public.finalize_application(p_application_id uuid, p_files jsonb)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.applications set submitted_at = now()
  where id = p_application_id and submitted_at is null;
  if not found then
    return false;
  end if;

  insert into public.application_files (application_id, field_key, storage_path, mime, size)
  select p_application_id, f->>'field_key', f->>'storage_path', f->>'mime', (f->>'size')::bigint
  from jsonb_array_elements(p_files) as f
  on conflict (storage_path) do nothing;

  return true;
end $$;

revoke execute on function public.finalize_application(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_application(uuid, jsonb) to service_role;
