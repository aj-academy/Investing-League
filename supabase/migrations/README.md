# Supabase migrations

Run in **Supabase → SQL Editor** after `schema.sql` and `rls.sql`.

| File | Purpose |
|------|---------|
| `auth_trigger_disclaimer.sql` | Signup trigger stores disclaimer metadata on profiles |
| `fix_missing_profiles.sql` | Backfill profiles + user_settings for existing auth users |
| `profiles_rls_insert.sql` | Profiles INSERT/UPDATE RLS for settings save |
| `subscription_plans.sql` | Plans, `scan_sessions`, usage log columns, `is_admin()` |

Recommended order: `fix_missing_profiles` → `profiles_rls_insert` → `subscription_plans` (or run only what you need).
