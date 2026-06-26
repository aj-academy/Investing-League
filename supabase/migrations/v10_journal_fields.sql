-- V10 pending order + timing journal fields
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS entry_method text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS signal_detected_time timestamptz;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS pending_order_placed_time timestamptz;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS planned_entry_time text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS actual_entry_time text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS signal_price numeric;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS pending_drift numeric;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS v10_layer text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS v10_timing_status text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS v10_strategy_type text;
ALTER TABLE public.trade_journal ADD COLUMN IF NOT EXISTS v10_blockers text;

NOTIFY pgrst, 'reload schema';
