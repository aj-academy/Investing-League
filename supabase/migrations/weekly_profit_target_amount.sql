-- Rename daily fixed target → weekly fixed target (safe to re-run).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'daily_profit_target_amount'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'weekly_profit_target_amount'
  ) THEN
    ALTER TABLE public.profiles
      RENAME COLUMN daily_profit_target_amount TO weekly_profit_target_amount;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'weekly_profit_target_amount'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN weekly_profit_target_amount numeric DEFAULT 0;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
