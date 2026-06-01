alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.signals enable row level security;
alter table public.trade_journal enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.market_cache enable row level security;
alter table public.scan_sessions enable row level security;

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

-- profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id or public.is_admin());
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- user_settings
create policy "settings_select_own" on public.user_settings for select using (auth.uid() = user_id or public.is_admin());
create policy "settings_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.user_settings for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);

-- signals
create policy "signals_select_own" on public.signals for select using (auth.uid() = user_id or public.is_admin());
create policy "signals_insert_own" on public.signals for insert with check (auth.uid() = user_id);
create policy "signals_update_own" on public.signals for update using (auth.uid() = user_id);

-- trade_journal
create policy "journal_select_own" on public.trade_journal for select using (auth.uid() = user_id or public.is_admin());
create policy "journal_insert_own" on public.trade_journal for insert with check (auth.uid() = user_id);
create policy "journal_update_own" on public.trade_journal for update using (auth.uid() = user_id);

-- subscriptions
create policy "subs_select_own" on public.subscriptions for select using (auth.uid() = user_id or public.is_admin());

-- usage_logs
create policy "usage_select_own" on public.usage_logs for select using (auth.uid() = user_id or public.is_admin());
create policy "usage_insert_own" on public.usage_logs for insert with check (auth.uid() = user_id);

-- audit_logs
create policy "audit_admin_read" on public.audit_logs for select using (public.is_admin());

-- market_cache (service role writes; authenticated read)
create policy "market_cache_read_auth" on public.market_cache for select to authenticated using (true);

-- scan_sessions
create policy "scan_sessions_select_own" on public.scan_sessions for select using (auth.uid() = user_id or public.is_admin());
create policy "scan_sessions_insert_own" on public.scan_sessions for insert with check (auth.uid() = user_id);
create policy "scan_sessions_update_own" on public.scan_sessions for update using (auth.uid() = user_id or public.is_admin());
