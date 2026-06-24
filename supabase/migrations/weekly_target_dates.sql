-- Week range for capital protection weekly target (calendar pickers in setup plan).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_target_from date;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_target_to date;

NOTIFY pgrst, 'reload schema';
