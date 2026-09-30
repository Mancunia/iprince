-- Defence in depth: drafts are never publicly readable, even if set as current_form_id.
drop policy profession_forms_public_read on public.profession_forms;
create policy profession_forms_public_read on public.profession_forms
  for select to anon, authenticated using (
    profession_forms.published_at is not null
    and exists (select 1 from public.professions p where p.current_form_id = profession_forms.id and p.is_active)
  );
