-- V10 permission tier journal fields (run after v10_journal_fields.sql)
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS v10_permission text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS v10_quality numeric;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS v10_warnings text;

NOTIFY pgrst, 'reload schema';
