-- Platform rules for users (admin-managed, acknowledgement on update)

create table if not exists public.rules_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Platform Rules',
  content text not null default '',
  is_active boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_rules_acknowledgement (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rules_id uuid not null references public.rules_documents(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  unique(user_id, rules_id)
);

create index if not exists idx_rules_documents_active on public.rules_documents(is_active, updated_at desc);
create index if not exists idx_user_rules_ack_user on public.user_rules_acknowledgement(user_id, acknowledged_at desc);

alter table public.rules_documents enable row level security;
alter table public.user_rules_acknowledgement enable row level security;

drop policy if exists "rules_read_active_or_admin" on public.rules_documents;
create policy "rules_read_active_or_admin" on public.rules_documents
  for select using (is_active = true or public.is_admin());

drop policy if exists "rules_ack_select_own_or_admin" on public.user_rules_acknowledgement;
create policy "rules_ack_select_own_or_admin" on public.user_rules_acknowledgement
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "rules_ack_insert_own" on public.user_rules_acknowledgement;
create policy "rules_ack_insert_own" on public.user_rules_acknowledgement
  for insert with check (auth.uid() = user_id);

drop policy if exists "rules_ack_update_own" on public.user_rules_acknowledgement;
create policy "rules_ack_update_own" on public.user_rules_acknowledgement
  for update using (auth.uid() = user_id);

insert into public.rules_documents (title, content, is_active)
select
  'Platform Rules',
  'Welcome to The Investing League Decision Lab.

1. Use the scanner for educational analysis only — not as financial advice.
2. Respect your daily scan limits and plan restrictions.
3. Journal every trade you verify for accurate analytics.
4. Do not share your login credentials with others.
5. Follow risk discipline: use daily trade limits and session filters.
6. Contact admin for plan upgrades or technical support via WhatsApp.',
  true
where not exists (select 1 from public.rules_documents where is_active = true limit 1);
