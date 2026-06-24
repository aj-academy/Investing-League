-- Capital Protection Plan: profiles, trade_journal extensions, daily_risk_summary
-- Safe to re-run (idempotent)

-- ─── profiles ───
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS starting_capital numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_capital numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS risk_per_trade_percent numeric DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_profit_target_percent numeric DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_profit_target_amount numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_loss_limit_percent numeric DEFAULT 15;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_consecutive_losses int DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_rules_seen_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trading_rules_accepted boolean DEFAULT false;

-- ─── trade_journal ───
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS trade_amount numeric DEFAULT 0;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS payout_percent numeric DEFAULT 0;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS return_amount numeric DEFAULT 0;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS net_profit numeric DEFAULT 0;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS capital_before numeric;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS capital_after numeric;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS consecutive_loss_count int DEFAULT 0;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS risk_status text DEFAULT 'normal';
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS scan_mode text DEFAULT 'practice';

-- ─── daily_risk_summary ───
CREATE TABLE IF NOT EXISTS public.daily_risk_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_date date NOT NULL DEFAULT current_date,
  starting_capital numeric DEFAULT 0,
  current_capital numeric DEFAULT 0,
  total_trades int DEFAULT 0,
  wins int DEFAULT 0,
  losses int DEFAULT 0,
  refunds int DEFAULT 0,
  net_profit numeric DEFAULT 0,
  consecutive_losses int DEFAULT 0,
  live_mode_locked boolean DEFAULT false,
  cooldown_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_risk_summary_user_date
  ON public.daily_risk_summary(user_id, trade_date DESC);

ALTER TABLE public.daily_risk_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_risk_select_own_or_admin" ON public.daily_risk_summary;
CREATE POLICY "daily_risk_select_own_or_admin" ON public.daily_risk_summary
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "daily_risk_insert_own" ON public.daily_risk_summary;
CREATE POLICY "daily_risk_insert_own" ON public.daily_risk_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_risk_update_own_or_admin" ON public.daily_risk_summary;
CREATE POLICY "daily_risk_update_own_or_admin" ON public.daily_risk_summary
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ─── verify (should return 9 rows) ───
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'starting_capital',
    'current_capital',
    'risk_per_trade_percent',
    'daily_profit_target_percent',
    'weekly_profit_target_amount',
    'daily_loss_limit_percent',
    'max_consecutive_losses',
    'login_rules_seen_at',
    'trading_rules_accepted'
  )
  ORDER BY column_name;

-- Reload API schema cache (fixes "column does not exist" / values stuck at 0)
NOTIFY pgrst, 'reload schema';
