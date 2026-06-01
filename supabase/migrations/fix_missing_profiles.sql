-- Run once in Supabase SQL Editor if users exist in Auth but profiles/settings are missing.

insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.user_settings (user_id)
select u.id
from auth.users u
where not exists (select 1 from public.user_settings s where s.user_id = u.id);

-- Ensure upsert works for authenticated users (idempotent if policies already exist).
drop policy if exists "settings_insert_own" on public.user_settings;
create policy "settings_insert_own" on public.user_settings
  for insert
  with check (auth.uid() = user_id);
