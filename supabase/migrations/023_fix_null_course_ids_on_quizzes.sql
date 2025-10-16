-- Update quizzes that have NULL course_id but have a chapter_id
-- Set course_id from the chapter's course_id
UPDATE quizzes
SET course_id = (
  SELECT course_id FROM chapters WHERE chapters.id = quizzes.chapter_id
)
WHERE quizzes.course_id IS NULL AND quizzes.chapter_id IS NOT NULL;
