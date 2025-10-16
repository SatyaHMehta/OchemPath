-- 022_add_choice_fk_to_answers.sql
-- Add missing foreign key constraint from answers.choice_id to choices.id
-- This allows the grade endpoint to join answers with choices to check correctness

ALTER TABLE IF EXISTS answers
ADD CONSTRAINT fk_answers_choice_id 
  FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE SET NULL;

-- Create index for better performance on the foreign key
CREATE INDEX IF NOT EXISTS idx_answers_choice_id ON answers(choice_id);

-- End migration
