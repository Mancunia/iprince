-- iPrince foundation schema. Translated fields are jsonb {"de": text, "en": text}.

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create type public.admin_role as enum ('owner', 'editor');
create type public.application_status as enum ('new', 'reviewing', 'contacted', 'placed', 'rejected', 'archived');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'closed', 'archived');
create type public.message_status as enum ('new', 'read', 'archived');
create type public.post_status as enum ('draft', 'published');
create type public.review_status as enum ('pending', 'approved', 'rejected');

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role public.admin_role not null default 'editor',
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (jsonb_typeof(name) = 'object' and name ? 'de'),
  summary jsonb not null default '{"de": "", "en": ""}',
  icon text not null default 'briefcase',
  is_featured boolean not null default false,
  is_active boolean not null default false,
  sort_order int not null default 0,
  open_positions int not null default 0 check (open_positions >= 0),
  current_form_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profession_forms (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid not null references public.professions (id) on delete cascade,
  version int not null check (version > 0),
  schema jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profession_id, version),
  unique (id, profession_id)
);

-- The current form must belong to the same profession (composite FK).
alter table public.professions
  add constraint professions_current_form_fk
  foreign key (current_form_id, id) references public.profession_forms (id, profession_id)
  on delete set null (current_form_id);

create or replace function public.forbid_published_form_change() returns trigger
language plpgsql as $$
begin
  if old.published_at is not null then
    raise exception 'published form versions are immutable' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger profession_forms_immutable
  before update on public.profession_forms
  for each row execute function public.forbid_published_form_change();

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid not null references public.professions (id) on delete restrict,
  form_id uuid not null references public.profession_forms (id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text,
  locale text not null check (locale in ('de', 'en')),
  answers jsonb not null default '{}',
  status public.application_status not null default 'new',
  submitted_at timestamptz,
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_inbox_idx on public.applications (status, submitted_at desc);
create index applications_profession_idx on public.applications (profession_id);

create table public.application_files (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  field_key text not null,
  storage_path text not null unique,
  mime text not null,
  size bigint not null check (size > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index application_files_application_idx on public.application_files (application_id);

create table public.employer_leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text not null,
  email text not null,
  phone text,
  profession_ids uuid[] not null default '{}',
  headcount int check (headcount is null or headcount > 0),
  message text not null default '',
  status public.lead_status not null default 'new',
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status public.message_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (name ? 'de'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title jsonb not null check (title ? 'de'),
  excerpt jsonb not null default '{"de": "", "en": ""}',
  body jsonb not null default '{"de": "", "en": ""}',
  category_id uuid references public.blog_categories (id) on delete set null,
  cover_path text,
  author_name text not null default 'iPrince',
  status public.post_status not null default 'draft',
  published_at timestamptz,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_published_idx on public.blog_posts (status, published_at desc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  role_title jsonb not null default '{"de": "", "en": ""}',
  organisation text,
  rating int not null check (rating between 1 and 5),
  body jsonb not null check (body ? 'de'),
  profession_id uuid references public.professions (id) on delete set null,
  status public.review_status not null default 'pending',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['admins', 'professions', 'profession_forms', 'applications', 'application_files',
    'employer_leads', 'contact_messages', 'blog_categories', 'blog_posts', 'reviews', 'site_content'] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t);
  end loop;
end $$;

-- Fixed-window rate limiting for public submissions.
create table public.rate_limits (
  bucket text not null,
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (bucket, key, window_start)
);

create or replace function public.hit_rate_limit(p_bucket text, p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count int;
begin
  insert into public.rate_limits (bucket, key, window_start, count)
  values (p_bucket, p_key, v_window, 1)
  on conflict (bucket, key, window_start) do update set count = public.rate_limits.count + 1
  returning count into v_count;

  delete from public.rate_limits where window_start < now() - interval '1 day';
  return v_count <= p_max;
end $$;

revoke execute on function public.hit_rate_limit(text, text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, text, int, int) to service_role;
