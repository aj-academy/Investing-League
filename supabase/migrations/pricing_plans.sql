-- Admin-managed pricing plans for the public landing page (run in Supabase SQL Editor)

create table if not exists public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_label text not null,
  best_for text not null,
  access_description text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_highlighted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pricing_plans_sort_idx on public.pricing_plans (sort_order asc, created_at asc);

alter table public.pricing_plans enable row level security;

-- Public read of active plans (optional if using service role in API)
drop policy if exists "pricing_plans_select_active" on public.pricing_plans;
create policy "pricing_plans_select_active" on public.pricing_plans
  for select using (is_active = true);

-- Seed default plans (Indian pricing) — skip if rows already exist
insert into public.pricing_plans (name, price_label, best_for, access_description, sort_order, is_active, is_highlighted)
select * from (values
  ('Trial Pass', '₹199 / 3 days', 'New users', 'Limited scanner, 1–2 assets, 10 scans/day', 1, true, false),
  ('Starter Scanner', '₹999 / month', 'Beginners', '3 assets, 30 scans/day, basic journal', 2, true, false),
  ('Pro Trader', '₹1,999 / month', 'Main paid users', '5 assets, 75 scans/day, live scanner, risk calculator, trade journal', 3, true, true),
  ('Elite Trader', '₹4,999 / month', 'Serious users', 'All assets, 150 scans/day, advanced analytics, priority support', 4, true, false),
  ('Mentor + App Plan', '₹9,999 / month', 'Premium users', 'Elite access + weekly group session + trade review education', 5, true, false)
) as v(name, price_label, best_for, access_description, sort_order, is_active, is_highlighted)
where not exists (select 1 from public.pricing_plans limit 1);
