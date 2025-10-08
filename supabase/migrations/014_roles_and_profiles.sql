-- 014_roles_and_profiles.sql
-- Role enum, extended profiles, role-specific profile tables, RLS, and triggers

-- Create role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student','professor','admin','guest');
  END IF;
END$$;

-- Extend profiles table columns (default for role will be set AFTER enum cast)

-- Convert role column to enum if still text
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role' AND udt_name = 'text'
  ) THEN
    -- Normalize existing values before cast
    -- Map legacy 'developer' to 'admin'; unknown/null -> 'student'
    UPDATE profiles
      SET role = CASE
        WHEN role IS NULL THEN 'student'
        WHEN role IN ('student','professor','admin','guest') THEN role
        WHEN role = 'developer' THEN 'admin'
        ELSE 'student'
      END;

    -- Drop existing default to avoid cast error
    ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

    -- Cast to enum with safety
    ALTER TABLE profiles
      ALTER COLUMN role TYPE user_role USING (
        CASE
          WHEN role IN ('student','professor','admin','guest') THEN role::user_role
          WHEN role = 'developer' THEN 'admin'::user_role
          ELSE 'student'::user_role
        END
      );

    -- Reapply typed default
    ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'student'::user_role;
  END IF;
END$$;

ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Forbid role change unless caller is admin
CREATE OR REPLACE FUNCTION profiles_forbid_role_change_non_admin()
RETURNS trigger AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    SELECT EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    ) INTO caller_is_admin;
    IF NOT coalesce(caller_is_admin, false) THEN
      RAISE EXCEPTION 'Only admin can change role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_forbid_role_change ON profiles;
CREATE TRIGGER profiles_forbid_role_change
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION profiles_forbid_role_change_non_admin();

-- Role-specific profile tables
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  student_id varchar(100),
  subscription_tier varchar(20) DEFAULT 'free',
  subscription_expires_at timestamptz,
  total_xp integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS professor_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  title varchar(50),
  department varchar(200),
  institution varchar(200),
  bio text,
  website_url varchar(500),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guest_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  access_level varchar(20) DEFAULT 'trial',
  trial_expires_at timestamptz DEFAULT (now() + interval '14 days'),
  interests text[],
  created_at timestamptz DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_student_id ON student_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_professor_profiles_institution ON professor_profiles(institution);

-- Enable RLS and policies
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS professor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guest_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: self can select/insert/update own row; admins can select all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_self'
  ) THEN
    CREATE POLICY profiles_select_self ON profiles FOR SELECT USING (id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_insert_self'
  ) THEN
    CREATE POLICY profiles_insert_self ON profiles FOR INSERT WITH CHECK (id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_self'
  ) THEN
    CREATE POLICY profiles_update_self ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_admin'
  ) THEN
    CREATE POLICY profiles_select_admin ON profiles FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );
  END IF;
END$$;

-- Student profiles policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'student_profiles' AND policyname = 'student_profiles_select_self'
  ) THEN
    CREATE POLICY student_profiles_select_self ON student_profiles FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'student_profiles' AND policyname = 'student_profiles_insert_self'
  ) THEN
    CREATE POLICY student_profiles_insert_self ON student_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'student_profiles' AND policyname = 'student_profiles_update_self'
  ) THEN
    CREATE POLICY student_profiles_update_self ON student_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'student_profiles' AND policyname = 'student_profiles_select_admin'
  ) THEN
    CREATE POLICY student_profiles_select_admin ON student_profiles FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );
  END IF;
END$$;

-- Professor profiles policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'professor_profiles' AND policyname = 'professor_profiles_select_self'
  ) THEN
    CREATE POLICY professor_profiles_select_self ON professor_profiles FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'professor_profiles' AND policyname = 'professor_profiles_insert_self'
  ) THEN
    CREATE POLICY professor_profiles_insert_self ON professor_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'professor_profiles' AND policyname = 'professor_profiles_update_self'
  ) THEN
    CREATE POLICY professor_profiles_update_self ON professor_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'professor_profiles' AND policyname = 'professor_profiles_select_admin'
  ) THEN
    CREATE POLICY professor_profiles_select_admin ON professor_profiles FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );
  END IF;
END$$;

-- Guest profiles policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guest_profiles' AND policyname = 'guest_profiles_select_self'
  ) THEN
    CREATE POLICY guest_profiles_select_self ON guest_profiles FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guest_profiles' AND policyname = 'guest_profiles_insert_self'
  ) THEN
    CREATE POLICY guest_profiles_insert_self ON guest_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guest_profiles' AND policyname = 'guest_profiles_update_self'
  ) THEN
    CREATE POLICY guest_profiles_update_self ON guest_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guest_profiles' AND policyname = 'guest_profiles_select_admin'
  ) THEN
    CREATE POLICY guest_profiles_select_admin ON guest_profiles FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );
  END IF;
END$$;
