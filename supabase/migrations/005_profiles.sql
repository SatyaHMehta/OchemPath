-- Create profiles table to store app roles and metadata
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text default 'student', -- 'student' | 'professor' | 'developer'
  created_at timestamptz default now()
);

-- Ensure users have a profile on sign up: (you may run a trigger in Supabase console or insert from app)

-- Index for role
create index if not exists idx_profiles_role on profiles(role);
