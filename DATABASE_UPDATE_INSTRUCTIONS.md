# Database Update Required

To enable the draft/publish functionality, you need to add a `published` column to the chapters table.

## Steps to add the column:

1. **Go to your Supabase Dashboard**: https://app.supabase.com/project/zajechrlsivmlyywhgwp
2. **Navigate to SQL Editor**
3. **Run this SQL command**:

```sql
-- Add published column to chapters table
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN chapters.published IS 'Whether the chapter is published and visible to students';

-- Optionally, set existing chapters as published (if you want them to remain visible)
-- UPDATE chapters SET published = true WHERE published IS NULL;
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