-- 017_add_ta_user_role.sql
-- Extend user_role enum to include 'ta' to support teaching assistants

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'ta'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'ta';
  END IF;
END$$;
