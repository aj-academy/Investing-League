-- Fix terms acceptance RLS (upsert needs INSERT + UPDATE policies)

drop policy if exists "terms_acceptance_update_own_or_admin" on public.user_terms_acceptance;
create policy "terms_acceptance_update_own_or_admin" on public.user_terms_acceptance
  for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Ensure insert policy exists
drop policy if exists "terms_acceptance_insert_own_or_admin" on public.user_terms_acceptance;
create policy "terms_acceptance_insert_own_or_admin" on public.user_terms_acceptance
  for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "terms_acceptance_select_own_or_admin" on public.user_terms_acceptance;
create policy "terms_acceptance_select_own_or_admin" on public.user_terms_acceptance
  for select
  using (auth.uid() = user_id or public.is_admin());

NOTIFY pgrst, 'reload schema';
