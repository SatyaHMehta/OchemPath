-- Migration 009: Add is_practice flag to quizzes and mark existing practice quizzes
-- Safe/idempotent: will not error if column already exists

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS is_practice boolean DEFAULT false;

-- Populate existing rows based on title heuristics (one-time, safe)
UPDATE quizzes
SET is_practice = true
WHERE is_practice IS DISTINCT FROM true AND title ILIKE '%practice%';

-- End migration
