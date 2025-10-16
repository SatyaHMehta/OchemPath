-- 019_publish_seeded_questions.sql
-- Mark all auto-seeded questions as published so they appear in student quizzes
-- This migration is idempotent and safe to run multiple times

UPDATE questions
SET published = true
WHERE published = false
  AND text LIKE 'Auto question%';

-- End migration
