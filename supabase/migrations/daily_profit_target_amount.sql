-- Optional fixed daily profit target (amount). Run after capital_protection_plan.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_profit_target_amount numeric DEFAULT 0;

NOTIFY pgrst, 'reload schema';
