-- Site-wide switches the owner controls from the admin. Exactly one row (id is always true).
create table public.site_settings (
  id boolean primary key default true check (id),
  chat_provider text not null default 'whatsapp' check (chat_provider in ('whatsapp', 'tawk', 'none')),
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings default values;

alter table public.site_settings enable row level security;

-- The public site reads the chat provider on every page. Only the owner may change it; no insert or delete policies keep the single row.
create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (true);
create policy site_settings_owner_update on public.site_settings
  for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
