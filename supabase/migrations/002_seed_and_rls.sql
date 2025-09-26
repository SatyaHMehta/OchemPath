-- Seed sample data and Row-Level Security policies for OchemPath

-- Insert a sample course, quiz, questions and choices
insert into courses (title, description) values
('General Organic Chemistry', 'Introductory course for OchemPath');

-- Create a sample quiz
insert into quizzes (course_id, title, description) select id, 'Sample Quiz 1', 'A tiny sample quiz' from courses limit 1;

-- Add a few questions and choices for the sample quiz
with q as (
  select id as quiz_id from quizzes order by created_at desc limit 1
)
insert into questions (quiz_id, position, text, type, points)
select q.quiz_id, 1, 'What is the hybridization of the central carbon in methane (CH4)?', 'multiple_choice', 1 from q;

with q as (
  select id as quiz_id from quizzes order by created_at desc limit 1
)
insert into choices (question_id, text, is_correct)
select questions.id, choices.text, choices.is_correct
from questions, (
  values
    ('sp', false),
    ('sp2', false),
    ('sp3', true),
    ('sp3d', false)
) as choices(text, is_correct)
where questions.quiz_id = (select id from quizzes order by created_at desc limit 1)
and questions.position = 1;

-- Enable Row Level Security for tables that contain user-owned data
alter table if exists submissions enable row level security;
alter table if exists answers enable row level security;
alter table if exists grades enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'submissions_select_self' AND c.relname = 'submissions'
  ) THEN
    CREATE POLICY submissions_select_self ON submissions
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'submissions_insert_own' AND c.relname = 'submissions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY submissions_insert_own ON submissions
        FOR INSERT WITH CHECK (user_id = auth.uid());
    $policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'answers_select_self' AND c.relname = 'answers'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY answers_select_self ON answers
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM submissions s WHERE s.id = answers.submission_id AND s.user_id = auth.uid()
          )
        );
    $policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'answers_insert_self' AND c.relname = 'answers'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY answers_insert_self ON answers
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM submissions s WHERE s.id = submission_id AND s.user_id = auth.uid()
          )
        );
    $policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'grades_select_user_or_grader' AND c.relname = 'grades'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY grades_select_user_or_grader ON grades
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM submissions s WHERE s.id = grades.submission_id AND s.user_id = auth.uid())
          OR grader_id = auth.uid()
        );
    $policy$;
  END IF;
END$$;

-- Do NOT create client-side INSERT/UPDATE policies for grades — grading should be performed server-side

-- Note: service_role key bypasses RLS so server endpoints using the service role can create grades and update submissions when grading
