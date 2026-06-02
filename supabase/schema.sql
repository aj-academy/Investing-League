create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  plan text not null default 'free' check (plan in ('free','starter','pro','admin')),
  is_active boolean not null default true,
  risk_disclaimer_accepted boolean not null default false,
  disclaimer_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  default_mode text not null default 'practice' check (default_mode in ('practice','live')),
  default_timeframe text not null default '5min',
  default_min_score int not null default 5,
  show_b_signals boolean not null default true,
  max_live_trades_per_window int not null default 1,
  auto_refresh_seconds int not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_uid text not null,
  pair text not null,
  timeframe text not null,
  expiry_minutes int,
  direction text check (direction in ('CALL','PUT')),
  grade text,
  confidence numeric,
  score numeric,
  score_gap numeric,
  weighted_score numeric,
  opposite_score numeric,
  signal_type text,
  signal_reason text,
  trade_eligible boolean not null default false,
  mode text not null default 'practice' check (mode in ('practice','live')),
  entry_time text,
  entry_price numeric,
  expiry_time text,
  adx numeric,
  atr numeric,
  rsi numeric,
  stoch numeric,
  cci numeric,
  bb text,
  macd_hist numeric,
  ema_wma_bias text,
  market_structure text,
  candle_body_ratio numeric,
  candle_strength text,
  loss_reason text,
  live_rank numeric,
  raw_payload jsonb,
  scan_session_id uuid,
  created_at timestamptz not null default now(),
  unique(user_id, signal_uid)
);

create table if not exists public.trade_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_id uuid references public.signals(id) on delete set null,
  signal_uid text,
  pair text not null,
  timeframe text not null,
  direction text check (direction in ('CALL','PUT')),
  grade text,
  confidence numeric,
  score numeric,
  signal_type text,
  signal_reason text,
  trade_eligible boolean not null default false,
  signal_entry_time text,
  signal_entry_price numeric,
  olymp_open_time text,
  olymp_opening_quote numeric,
  olymp_closing_quote numeric,
  olymp_trade_id text,
  expiry_time text,
  expiry_minutes int,
  result text not null default 'Pending' check (result in ('Pending','Win','Loss','Refund')),
  result_source text not null default 'Unverified' check (result_source in ('Auto','Manual','Unverified')),
  entry_drift numeric,
  entry_status text check (entry_status in ('Valid Entry','Risky Entry','Invalid Entry','Pending')),
  loss_reason text,
  marked_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, signal_uid)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  pair text,
  timeframe text,
  mode text,
  request_count int not null default 1,
  provider_calls int default 0,
  cache_hits int default 0,
  estimated_provider_calls int default 0,
  blocked_reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

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

create table if not exists public.market_cache (
  id uuid primary key default gen_random_uuid(),
  pair text not null,
  interval text not null,
  outputsize int not null,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  unique(pair, interval, outputsize)
);

create index if not exists idx_signals_user_created on public.signals(user_id, created_at desc);
create index if not exists idx_signals_user_pair on public.signals(user_id, pair);
create index if not exists idx_trade_journal_user_created on public.trade_journal(user_id, created_at desc);
create index if not exists idx_trade_journal_user_result on public.trade_journal(user_id, result);
create index if not exists idx_trade_journal_user_pair on public.trade_journal(user_id, pair);
create index if not exists idx_usage_logs_user_created on public.usage_logs(user_id, created_at desc);
create index if not exists idx_usage_logs_scan_today on public.usage_logs(user_id, action, created_at desc);
create index if not exists idx_scan_sessions_user_expires on public.scan_sessions(user_id, expires_at desc);
create index if not exists idx_signals_scan_session on public.signals(scan_session_id);
create index if not exists idx_user_asset_access_user on public.user_asset_access(user_id);
create index if not exists idx_terms_documents_active on public.terms_documents(is_active, created_at desc);
create index if not exists idx_user_terms_acceptance_user on public.user_terms_acceptance(user_id, accepted_at desc);

alter table public.signals
  drop constraint if exists signals_scan_session_id_fkey,
  add constraint signals_scan_session_id_fkey
  foreign key (scan_session_id) references public.scan_sessions(id) on delete set null;

-- Auto-create profile + settings on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, risk_disclaimer_accepted, disclaimer_accepted_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'risk_disclaimer_accepted')::boolean, false),
    case
      when coalesce((new.raw_user_meta_data->>'risk_disclaimer_accepted')::boolean, false)
      then now()
      else null
    end
  )
  on conflict (id) do nothing;
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
