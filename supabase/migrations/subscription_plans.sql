-- Subscription plans, scan sessions, usage tracking (run in Supabase SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS where needed.

-- Required by scan_sessions RLS policies (skip if you already ran supabase/rls.sql)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free','starter','pro','admin'));

create table if not exists public.scan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'practice',
  pairs text[] not null,
  timeframes text[] not null,
  min_score int,
  show_b_signals boolean,
  session_filter text,
  total_signals int default 0,
  provider_calls int default 0,
  cache_hits int default 0,
  estimated_provider_calls int default 0,
  plan_at_scan text default 'free',
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table public.signals
  add column if not exists scan_session_id uuid references public.scan_sessions(id) on delete set null;

alter table public.usage_logs add column if not exists provider_calls int default 0;
alter table public.usage_logs add column if not exists cache_hits int default 0;
alter table public.usage_logs add column if not exists estimated_provider_calls int default 0;
alter table public.usage_logs add column if not exists blocked_reason text;

create index if not exists idx_scan_sessions_user_expires on public.scan_sessions(user_id, expires_at desc);
create index if not exists idx_signals_scan_session on public.signals(scan_session_id);
create index if not exists idx_usage_logs_scan_today on public.usage_logs(user_id, action, created_at desc);

alter table public.scan_sessions enable row level security;

drop policy if exists "scan_sessions_select_own" on public.scan_sessions;
create policy "scan_sessions_select_own" on public.scan_sessions
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "scan_sessions_insert_own" on public.scan_sessions;
create policy "scan_sessions_insert_own" on public.scan_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "scan_sessions_update_own" on public.scan_sessions;
create policy "scan_sessions_update_own" on public.scan_sessions
  for update using (auth.uid() = user_id or public.is_admin());
