-- Initial schema for OchemPath

create extension if not exists pgcrypto;

-- courses
create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- quizzes
create table if not exists quizzes (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  description text,
  created_by uuid,
  created_at timestamptz default now()
);

-- questions
create table if not exists questions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references quizzes(id) on delete cascade,
  position int not null,
  text text not null,
  type text default 'multiple_choice',
  points int default 1
);

-- choices
create table if not exists choices (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references questions(id) on delete cascade,
  text text not null,
  is_correct boolean default false
);

-- submissions
create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references quizzes(id),
  user_id uuid,
  started_at timestamptz default now(),
  finished_at timestamptz,
  score numeric,
  graded boolean default false
);

-- answers
create table if not exists answers (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references submissions(id) on delete cascade,
  question_id uuid references questions(id),
  choice_id uuid,
  text_answer text
);

-- grades
create table if not exists grades (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references submissions(id),
  grader_id uuid,
  points numeric,
  feedback text,
  created_at timestamptz default now()
);
