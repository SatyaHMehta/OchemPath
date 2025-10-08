-- 018_profiles_on_auth_signup.sql
-- Create a trigger to auto-insert into profiles when auth.users gets a new user

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create profile if not exists. Qualify enum type to avoid search_path issues.
  insert into public.profiles (id, display_name, role, email_verified)
  values (
    new.id,
    split_part(new.email, '@', 1),
    'student'::public.user_role,
    coalesce(new.email_confirmed_at is not null, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
