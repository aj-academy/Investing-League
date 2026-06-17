-- Capital Protection Plan: profiles, trade_journal extensions, daily_risk_summary

alter table public.profiles
  add column if not exists starting_capital numeric default 0,
  add column if not exists current_capital numeric default 0,
  add column if not exists risk_per_trade_percent numeric default 5,
  add column if not exists daily_profit_target_percent numeric default 10,
  add column if not exists daily_loss_limit_percent numeric default 15,
  add column if not exists max_consecutive_losses int default 3,
  add column if not exists login_rules_seen_at timestamptz,
  add column if not exists trading_rules_accepted boolean default false;

alter table public.trade_journal
  add column if not exists trade_amount numeric default 0,
  add column if not exists payout_percent numeric default 0,
  add column if not exists return_amount numeric default 0,
  add column if not exists net_profit numeric default 0,
  add column if not exists capital_before numeric,
  add column if not exists capital_after numeric,
  add column if not exists consecutive_loss_count int default 0,
  add column if not exists risk_status text default 'normal',
  add column if not exists scan_mode text default 'practice';

create table if not exists public.daily_risk_summary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_date date not null default current_date,
  starting_capital numeric default 0,
  current_capital numeric default 0,
  total_trades int default 0,
  wins int default 0,
  losses int default 0,
  refunds int default 0,
  net_profit numeric default 0,
  consecutive_losses int default 0,
  live_mode_locked boolean default false,
  cooldown_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, trade_date)
);

create index if not exists idx_daily_risk_summary_user_date
  on public.daily_risk_summary(user_id, trade_date desc);

alter table public.daily_risk_summary enable row level security;

create policy "daily_risk_select_own_or_admin" on public.daily_risk_summary
  for select using (auth.uid() = user_id or public.is_admin());

create policy "daily_risk_insert_own" on public.daily_risk_summary
  for insert with check (auth.uid() = user_id);

create policy "daily_risk_update_own_or_admin" on public.daily_risk_summary
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
