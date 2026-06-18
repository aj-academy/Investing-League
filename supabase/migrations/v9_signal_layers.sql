-- V9 signal layer columns on trade_journal (optional metadata for analytics/admin)
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS v9_layer text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS v9_readiness numeric;

NOTIFY pgrst, 'reload schema';
