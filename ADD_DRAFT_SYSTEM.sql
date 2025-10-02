-- Migration: Add draft system to questions table
-- This enables proper draft workflow where original questions stay published

-- Add draft_of column to link draft questions to their original
ALTER TABLE questions ADD COLUMN IF NOT EXISTS draft_of uuid REFERENCES questions(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN questions.draft_of IS 'If this is a draft, references the original published question ID. NULL for original questions.';

-- Index for better performance when querying drafts
CREATE INDEX IF NOT EXISTS idx_questions_draft_of ON questions(draft_of);

-- Update existing unpublished questions to be properly published
-- (This fixes any questions that got unpublished by the old system)
UPDATE questions 
SET published = true 
WHERE published = false AND draft_of IS NULL AND chapter_id IS NOT NULL;