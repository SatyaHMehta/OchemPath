-- CRITICAL MIGRATIONS: Run these in Supabase SQL Editor
-- These fix the quiz submission score storage issue

-- ============================================================================
-- MIGRATION 022 (RUN FIRST): Add Missing Foreign Key
-- ============================================================================
-- This enables the grade API to JOIN answers with choices to check correctness

ALTER TABLE IF EXISTS answers
ADD CONSTRAINT fk_answers_choice_id 
  FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_answers_choice_id ON answers(choice_id);

-- ============================================================================
-- MIGRATION 019 (RUN SECOND): Publish Seeded Questions
-- ============================================================================
-- This makes questions visible on quiz pages (quiz API filters for published = true)

UPDATE questions
SET published = true
WHERE published = false
  AND text LIKE 'Auto question%';

-- ============================================================================
-- MIGRATION 021 (OPTIONAL): Clean Up Mock Users
-- ============================================================================
-- Remove the mock_users table if you're using real users only

-- DROP TABLE IF EXISTS public.mock_users CASCADE;