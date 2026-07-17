-- 2M Micro journal fields (separate from V9 LIVE win rate)
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS strategy_type text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS micro_permission text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS micro_label text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS micro_readiness numeric;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS source_layer text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS notes text;

NOTIFY pgrst, 'reload schema';
