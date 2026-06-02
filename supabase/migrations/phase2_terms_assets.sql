-- Phase 2 terms + asset access + admin analytics surfaces (idempotent).

create table if not exists public.user_asset_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pair text not null,
  is_allowed boolean not null default true,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, pair)
);

create table if not exists public.terms_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  version text not null,
  content text,
  file_url text,
  is_active boolean not null default false,
  requires_reacceptance boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(version)
);

create table if not exists public.user_terms_acceptance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_id uuid not null references public.terms_documents(id) on delete cascade,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  unique(user_id, terms_id)
);

create index if not exists idx_user_asset_access_user on public.user_asset_access(user_id);
create index if not exists idx_terms_documents_active on public.terms_documents(is_active, created_at desc);
create index if not exists idx_user_terms_acceptance_user on public.user_terms_acceptance(user_id, accepted_at desc);

alter table public.user_asset_access enable row level security;
alter table public.terms_documents enable row level security;
alter table public.user_terms_acceptance enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_asset_access'
      and policyname = 'asset_access_select_own_or_admin'
  ) then
    create policy "asset_access_select_own_or_admin" on public.user_asset_access
      for select using (auth.uid() = user_id or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_asset_access'
      and policyname = 'asset_access_admin_insert'
  ) then
    create policy "asset_access_admin_insert" on public.user_asset_access
      for insert with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_asset_access'
      and policyname = 'asset_access_admin_update'
  ) then
    create policy "asset_access_admin_update" on public.user_asset_access
      for update using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_asset_access'
      and policyname = 'asset_access_admin_delete'
  ) then
    create policy "asset_access_admin_delete" on public.user_asset_access
      for delete using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'terms_documents'
      and policyname = 'terms_read_active_or_admin'
  ) then
    create policy "terms_read_active_or_admin" on public.terms_documents
      for select using (is_active = true or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'terms_documents'
      and policyname = 'terms_admin_insert'
  ) then
    create policy "terms_admin_insert" on public.terms_documents
      for insert with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'terms_documents'
      and policyname = 'terms_admin_update'
  ) then
    create policy "terms_admin_update" on public.terms_documents
      for update using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_terms_acceptance'
      and policyname = 'terms_acceptance_select_own_or_admin'
  ) then
    create policy "terms_acceptance_select_own_or_admin" on public.user_terms_acceptance
      for select using (auth.uid() = user_id or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_terms_acceptance'
      and policyname = 'terms_acceptance_insert_own_or_admin'
  ) then
    create policy "terms_acceptance_insert_own_or_admin" on public.user_terms_acceptance
      for insert with check (auth.uid() = user_id or public.is_admin());
  end if;
end
$$;
