-- Run in Supabase SQL Editor if signup already works but disclaimer fields are empty.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, risk_disclaimer_accepted, disclaimer_accepted_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'risk_disclaimer_accepted')::boolean, false),
    case
      when coalesce((new.raw_user_meta_data->>'risk_disclaimer_accepted')::boolean, false)
      then now()
      else null
    end
  )
  on conflict (id) do nothing;
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
