-- Migration: Add published status and practice fields to questions table

-- Add published column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;

-- Add chapter_id column to questions table for direct practice questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE;

-- Add is_practice column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_practice boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN questions.published IS 'Whether the question is published and visible to students';
COMMENT ON COLUMN questions.chapter_id IS 'Direct reference to chapter for practice questions (optional, can be null for quiz questions)';
COMMENT ON COLUMN questions.is_practice IS 'Whether this is a practice question (true) or quiz question (false)';

-- Index for better performance when querying practice questions
CREATE INDEX IF NOT EXISTS idx_questions_chapter_practice ON questions(chapter_id, is_practice, published);