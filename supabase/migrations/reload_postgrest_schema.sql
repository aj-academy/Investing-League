-- Run AFTER capital_protection_plan.sql so Supabase API sees new columns immediately.
NOTIFY pgrst, 'reload schema';
