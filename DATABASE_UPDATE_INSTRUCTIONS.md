# 🚨 CRITICAL: Database Update Required for Draft System

Your application now uses a proper draft system for question editing. You need to add the draft system to your database.

## Steps to Add Draft System:

1. **Go to your Supabase Dashboard**: https://app.supabase.com/project/zajechrlsivmlyywhgwp
2. **Navigate to SQL Editor**
3. **Run this SQL command** (copy/paste all):

```sql
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
```

## What this enables:

- **Proper Draft System**: Edited questions create draft copies, original questions stay published
- **No Broken Quizzes**: Students always see the published version, never broken by edits
- **Persistent Drafts**: You can leave and come back to continue editing drafts
- **Easy Discard**: Discarding drafts simply deletes them, restoring originals
- **Draft Indicators**: UI shows "DRAFT" badges for questions with pending changes

## Testing:

After adding the column:

1. Create a new chapter in the creator dashboard
2. Notice it's saved as a draft with a "DRAFT" badge
3. Visit the course page - the chapter won't appear
4. Go back to creator dashboard and click "Publish Chapter"
5. Visit the course page again - the chapter now appears

This prevents accidental publication of incomplete chapters!

## Image Upload Support (REQUIRED for Image Uploads)

🚨 **CRITICAL**: Follow these steps to fix image upload errors (400 status codes):

### STEP 1: Run this SQL to add image columns:

```sql
-- Add image support to questions and choices tables
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url text;
COMMENT ON COLUMN questions.image_url IS 'URL for question image (optional)';

ALTER TABLE choices ADD COLUMN IF NOT EXISTS image_url text;
COMMENT ON COLUMN choices.image_url IS 'URL for choice image (optional)';
```

### STEP 2: Set up Storage Bucket (Use Dashboard - NOT SQL):

**The storage policies require dashboard access to avoid permission errors.**

1. **Go to Storage** in your Supabase dashboard: https://app.supabase.com/project/zajechrlsivmlyywhgwp/storage/buckets

2. **Create New Bucket**:

   - Click "**New Bucket**"
   - **Name**: `question-images`
   - **Public bucket**: ✅ **CHECKED** (This is critical!)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/gif,image/webp`
   - Click "**Save**"

3. **Set up Policies** (Click on the `question-images` bucket, then "Policies" tab):

   **Policy 1 - Public Read Access**:

   - Click "**New Policy**" → "**Custom Policy**"
   - **Policy Name**: `Public read access for question images`
   - **Allowed Operation**: `SELECT`
   - **Target Roles**: `public`
   - **USING expression**: `bucket_id = 'question-images'`
   - Click "**Save Policy**"

   **Policy 2 - Authenticated Upload**:

   - Click "**New Policy**" → "**Custom Policy**"
   - **Policy Name**: `Authenticated users can upload question images`
   - **Allowed Operation**: `INSERT`
   - **Target Roles**: `authenticated`
   - **WITH CHECK expression**: `bucket_id = 'question-images'`
   - Click "**Save Policy**"

   **Policy 3 - Authenticated Update**:

   - Click "**New Policy**" → "**Custom Policy**"
   - **Policy Name**: `Authenticated users can update question images`
   - **Allowed Operation**: `UPDATE`
   - **Target Roles**: `authenticated`
   - **USING expression**: `bucket_id = 'question-images'`
   - Click "**Save Policy**"

   **Policy 4 - Authenticated Delete**:

   - Click "**New Policy**" → "**Custom Policy**"
   - **Policy Name**: `Authenticated users can delete question images`
   - **Allowed Operation**: `DELETE`
   - **Target Roles**: `authenticated`
   - **USING expression**: `bucket_id = 'question-images'`
   - Click "**Save Policy**"

### STEP 3: Test the fix:

After completing the storage setup, try uploading an image in the question builder. You should see the image appear successfully instead of getting a 400 error.

This enables:

- **Question Images**: Upload images for question prompts
- **Choice Images**: Upload images for individual answer choices
- **Drag & Drop**: Modern file upload interface
- **Auto Storage**: Images stored in Supabase Storage
- **Public Access**: Images viewable by students taking quizzes

```

```
