-- Seed quizzes, questions, and choices for existing chapters
-- This script creates one quiz per chapter with 3 questions each (multiple choice) and simple distractors.

-- For each chapter, create a quiz and 3 questions with 4 choices each.
DO $$
DECLARE
  chap record;
  v_quiz_id uuid;
  qid uuid;
  choice_texts text[];
  i int;
  j int;
BEGIN
  FOR chap IN SELECT id, course_id, position FROM chapters LOOP
    -- find or create a chapter quiz
    SELECT id INTO v_quiz_id FROM quizzes WHERE chapter_id = chap.id AND title = format('Chapter %s Quiz', chap.position) LIMIT 1;
    IF v_quiz_id IS NULL THEN
      INSERT INTO quizzes (course_id, chapter_id, title, description, created_at)
      VALUES (chap.course_id, chap.id, format('Chapter %s Quiz', chap.position), 'Auto-seeded chapter quiz', now())
      RETURNING id INTO v_quiz_id;
    END IF;

    -- If this quiz already has questions, skip
    IF (SELECT count(*) FROM questions WHERE questions.quiz_id = v_quiz_id) > 0 THEN
      CONTINUE;
    END IF;

    -- Insert 3 questions with 4 choices each
    FOR i IN 1..3 LOOP
  INSERT INTO questions (quiz_id, position, text, type, points, published)
  VALUES (v_quiz_id, i, format('Auto question %s for chapter %s', i, chap.position), 'multiple_choice', 1, true)
  RETURNING id INTO qid;

      choice_texts := ARRAY[
        'Correct answer',
        'Plausible distractor A',
        'Plausible distractor B',
        'Plausible distractor C'
      ];

      FOR j IN array_lower(choice_texts,1)..array_upper(choice_texts,1) LOOP
        INSERT INTO choices (question_id, text, is_correct)
        VALUES (qid, choice_texts[j], j = 1);
      END LOOP;
    END LOOP;
  END LOOP;
END$$;

-- End of seed script
