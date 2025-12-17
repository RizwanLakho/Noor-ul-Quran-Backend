-- ============================================================
-- FIX QUIZ SCHEMA MISMATCHES
-- This migration fixes column name mismatches between
-- the database schema and the application code
-- ============================================================

-- Fix quizzes table
BEGIN;

-- 1. Rename 'name' to 'title'
ALTER TABLE quizzes
RENAME COLUMN name TO title;

-- 2. Rename 'time_limit_minutes' to 'time_limit'
ALTER TABLE quizzes
RENAME COLUMN time_limit_minutes TO time_limit;

-- 3. Add 'question_count' column
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 0;

-- Update existing quizzes with their actual question count
UPDATE quizzes
SET question_count = (
  SELECT COUNT(*)
  FROM quiz_questions
  WHERE quiz_questions.quiz_id = quizzes.id
);

COMMIT;

-- Fix quiz_questions table
BEGIN;

-- 1. Add 'explanation' column
ALTER TABLE quiz_questions
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- 2. Add 'created_by' column
ALTER TABLE quiz_questions
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

COMMIT;

-- Display success message
SELECT
  'Quiz schema fixed successfully!' AS status,
  COUNT(*) AS total_quizzes
FROM quizzes;

SELECT
  'Quiz questions schema fixed!' AS status,
  COUNT(*) AS total_questions
FROM quiz_questions;
