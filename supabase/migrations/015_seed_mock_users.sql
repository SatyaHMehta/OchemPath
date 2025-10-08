-- 015_seed_mock_users.sql
-- Dev seed for Users screen. Creates a lightweight users_mock table and seeds 12 entries
-- matching the current mock UI. This is used only when no real profiles exist.

create table if not exists users_mock (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role user_role not null default 'student',
  university text,
  courses int default 0,
  attempts int default 0,
  avg_score numeric default 0, -- 0..1
  practice_coverage numeric default 0, -- 0..1
  is_active boolean default true,
  last_active_at timestamptz default now()
);

insert into users_mock (name, email, role, university, courses, attempts, avg_score, practice_coverage, is_active, last_active_at) values
 ('User #1', 'user1@example.com', 'student', 'UCLA', 3, 14, 0.88, 0.72, true, now() - interval '2 days'),
 ('User #2', 'user2@example.com', 'student', 'UT Austin', 2, 17, 0.76, 0.58, true, now() - interval '1 day'),
 ('Professor #1', 'prof1@example.com', 'professor', 'UC Berkeley', 4, 14, 0.62, 0.40, true, now() - interval '4 hours'),
 ('User #3', 'user3@example.com', 'student', 'MIT', 1, 19, 0.70, 0.66, false, now() - interval '3 days'),
 ('TA #1', 'ta1@example.com', 'ta', 'Stanford', 3, 3, 0.92, 0.31, true, now() - interval '5 days'),
 ('User #4', 'user4@example.com', 'student', 'Harvard', 3, 7, 0.63, 0.36, true, now() - interval '6 days'),
 ('User #5', 'user5@example.com', 'student', 'UWashington', 1, 11, 0.63, 0.42, true, now() - interval '8 days'),
 ('Professor #2', 'prof2@example.com', 'professor', 'UChicago', 3, 5, 0.69, 0.45, true, now() - interval '1 day'),
 ('User #6', 'user6@example.com', 'student', 'NYU', 3, 15, 0.93, 0.84, true, now() - interval '2 days'),
 ('GuestUser #1', 'guest1@example.com', 'guest', '—', 0, 0, 0.50, 0.10, false, now() - interval '9 days'),
 ('Admin #1', 'admin1@example.com', 'admin', '—', 0, 0, 1.00, 0.00, true, now()),
 ('GuestUser #2', 'guest2@example.com', 'guest', '—', 0, 0, 0.00, 0.00, false, now() - interval '3 hours')
on conflict (email) do nothing;
