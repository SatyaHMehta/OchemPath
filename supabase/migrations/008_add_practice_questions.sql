-- Migration: add mock practice questions for chapters' practice quizzes
-- Inserts three practice questions (with choices and correct flags) into quizzes with title LIKE '%Practice%'
-- only if the specific mock questions are not already present.

DO $$
DECLARE
  q record;
  v_quiz_id uuid;
  qid uuid;
BEGIN
  FOR q IN SELECT id FROM quizzes WHERE title ILIKE '%practice%' LOOP
    v_quiz_id := q.id;

    -- If this quiz already has any of these mock questions (by text), skip
    IF EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id AND text = 'Identify the aromatic ring shown (ignore substituents).') THEN
      CONTINUE;
    END IF;

    -- Insert question 1 (with image)
    INSERT INTO questions (quiz_id, position, text, type, points)
    VALUES (v_quiz_id, (SELECT COALESCE(MAX(position),0)+1 FROM questions WHERE quiz_id = v_quiz_id), 'Identify the aromatic ring shown (ignore substituents).', 'multiple_choice', 1)
    RETURNING id INTO qid;

    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'Cyclohexane', false);
    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'Benzene', true);
    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'Phenol', false);
    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'Pyridine', false);

    -- Insert question 2
  INSERT INTO questions (quiz_id, position, text, type, points)
  VALUES (v_quiz_id, (SELECT COALESCE(MAX(position),0)+1 FROM questions WHERE quiz_id = v_quiz_id), 'Which hybridization most describes the carbon atoms in ethene?', 'multiple_choice', 1)
  RETURNING id INTO qid;

    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'sp^3', false);
    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'sp^2', true);
    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'sp', false);
    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'It depends on resonance', false);

    -- Insert question 3
  INSERT INTO questions (quiz_id, position, text, type, points)
  VALUES (v_quiz_id, (SELECT COALESCE(MAX(position),0)+1 FROM questions WHERE quiz_id = v_quiz_id), 'Which statement about electronegativity and bond polarity is TRUE?', 'multiple_choice', 1)
  RETURNING id INTO qid;

    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'Bonds between identical atoms are always polar.', false);
    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'Greater electronegativity difference increases bond polarity.', true);
    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'A polar bond always makes the whole molecule polar.', false);
    INSERT INTO choices (question_id, text, is_correct) VALUES (qid, 'Electronegativity is unrelated to electron density.', false);

  END LOOP;
END$$;

-- End migration
