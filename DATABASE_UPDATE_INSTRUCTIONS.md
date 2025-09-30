# 🚨 CRITICAL: Database Update Required for Production

Your deployment is failing because the database is missing required columns for the practice questions system.

## Steps to Fix Production Errors:

1. **Go to your Supabase Dashboard**: https://app.supabase.com/project/zajechrlsivmlyywhgwp
2. **Navigate to SQL Editor**
3. **Run this SQL command** (copy/paste all):

```sql
-- Add published column to chapters table (if not already added)
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;
COMMENT ON COLUMN chapters.published IS 'Whether the chapter is published and visible to students';

-- CRITICAL: Add missing columns to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_practice boolean DEFAULT false;

-- Add comments for questions table
COMMENT ON COLUMN questions.published IS 'Whether the question is published and visible to students';
COMMENT ON COLUMN questions.chapter_id IS 'Direct reference to chapter for practice questions (optional)';
COMMENT ON COLUMN questions.is_practice IS 'Whether this is a practice question (true) or quiz question (false)';

-- Create performance index
CREATE INDEX IF NOT EXISTS idx_questions_chapter_practice ON questions(chapter_id, is_practice, published);

-- Make existing content visible (set to published)
UPDATE chapters SET published = true WHERE published IS NULL;
UPDATE questions SET published = true WHERE published IS NULL;

-- Mark existing practice questions
UPDATE questions SET is_practice = true WHERE quiz_id IN (
  SELECT id FROM quizzes WHERE is_practice = true OR title ILIKE '%practice%'
);
```

## What this enables:

- **Drafts**: New chapters are saved as drafts by default
- **Publish Control**: You must click "Publish Chapter" to make chapters visible to students
- **Draft Warnings**: UI shows warnings for unpublished chapters
- **Course Page**: Only published chapters appear on the public course pages
- **Draft Indicators**: Draft chapters show "DRAFT" badges in the creator dashboard

## Testing:

After adding the column:
1. Create a new chapter in the creator dashboard
2. Notice it's saved as a draft with a "DRAFT" badge
3. Visit the course page - the chapter won't appear
4. Go back to creator dashboard and click "Publish Chapter"
5. Visit the course page again - the chapter now appears

This prevents accidental publication of incomplete chapters!