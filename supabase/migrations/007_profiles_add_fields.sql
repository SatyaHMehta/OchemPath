-- Add additional profile fields for richer signup data
alter table if exists profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists dob date,
  add column if not exists university_id integer references universities(id) on delete set null;

create index if not exists idx_profiles_university_id on profiles(university_id);
