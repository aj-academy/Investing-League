-- Phase 1 admin hardening migration (idempotent).

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

alter table public.usage_logs
add column if not exists provider_calls int not null default 0,
add column if not exists cache_hits int not null default 0,
add column if not exists estimated_provider_calls int not null default 0,
add column if not exists blocked_reason text;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_logs'
      and policyname = 'audit_admin_read'
  ) then
    create policy "audit_admin_read"
      on public.audit_logs
      for select
      using (public.is_admin());
  end if;
end
$$;
