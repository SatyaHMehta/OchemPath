 -- Migration 010: Add image column to questions (for question images used by the UI)
-- Safe/idempotent: will not error if column already exists

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS image text;

-- End migration
