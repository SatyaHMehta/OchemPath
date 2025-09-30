-- IMPORTANT: Run these SQL commands in your Supabase SQL Editor
-- to add the missing columns to the questions table

-- 1. Add the published column
ALTER TABLE questions ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;

-- 2. Add the chapter_id column for direct practice questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE;

-- 3. Add the is_practice column
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_practice boolean DEFAULT false;

-- 4. Add helpful comments
COMMENT ON COLUMN questions.published IS 'Whether the question is published and visible to students';
COMMENT ON COLUMN questions.chapter_id IS 'Direct reference to chapter for practice questions (optional)';
COMMENT ON COLUMN questions.is_practice IS 'Whether this is a practice question (true) or quiz question (false)';

-- 5. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_questions_chapter_practice ON questions(chapter_id, is_practice, published);

-- 6. Optional: Set existing questions to published (if you want them visible)
-- UPDATE questions SET published = true WHERE published IS NULL;

-- 7. Optional: Mark existing practice questions
-- UPDATE questions SET is_practice = true WHERE quiz_id IN (
--   SELECT id FROM quizzes WHERE is_practice = true OR title ILIKE '%practice%'
-- );