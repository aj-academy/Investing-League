# Supabase migrations

Run in **Supabase → SQL Editor** after `schema.sql` and `rls.sql`.

| File | Purpose |
|------|---------|
| `auth_trigger_disclaimer.sql` | Signup trigger stores disclaimer metadata on profiles |
| `fix_missing_profiles.sql` | Backfill profiles + user_settings for existing auth users |
| `profiles_rls_insert.sql` | Profiles INSERT/UPDATE RLS for settings save |
| `subscription_plans.sql` | Plans, `scan_sessions`, usage log columns, `is_admin()` |
| `admin_core_phase1.sql` | Admin hardening: audit logs + usage columns safety checks |
| `phase2_terms_assets.sql` | Terms documents, user acceptance, and per-user asset access with RLS |
| `pricing_plans.sql` | Admin-managed pricing plans for the public home page |
| `platform_rules.sql` | Admin-managed platform rules with user acknowledgement |

Recommended order: `fix_missing_profiles` → `profiles_rls_insert` → `subscription_plans` → `admin_core_phase1` → `phase2_terms_assets` → `pricing_plans` → `platform_rules` (or run only what you need).
