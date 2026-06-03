-- Fix journal update RLS so admins can update rows and WITH CHECK is explicit.
drop policy if exists "journal_update_own" on public.trade_journal;
create policy "journal_update_own" on public.trade_journal
for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());
