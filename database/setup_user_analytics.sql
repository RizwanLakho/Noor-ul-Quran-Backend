-- ============================================================
-- USER ANALYTICS SETUP SCRIPT
-- This script ensures all required tables for user activity
-- tracking are present in the database
-- ============================================================

-- Check if tables exist and create missing ones

-- 1. Ensure user_quiz_attempts table exists
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,

  -- Results
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2) DEFAULT 0.00,
  passed BOOLEAN DEFAULT false,

  -- Time tracking
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  time_taken_seconds INTEGER,

  -- Status
  status VARCHAR(20) DEFAULT 'in_progress',  -- 'in_progress', 'completed'
  can_review BOOLEAN DEFAULT true
);

-- 2. Ensure user_topic_progress table exists
CREATE TABLE IF NOT EXISTS user_topic_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,

  -- Progress metrics
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,

  -- Item tracking (PostgreSQL arrays)
  ayahs_read INTEGER[] DEFAULT '{}',
  hadith_read INTEGER[] DEFAULT '{}',

  -- Timestamps
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,

  -- Analytics
  view_count INTEGER DEFAULT 1,
  time_spent_seconds INTEGER DEFAULT 0,

  -- One progress record per user per topic
  UNIQUE(user_id, topic_id)
);

-- 3. Ensure user_bookmarks table exists
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- One bookmark per user per topic
  UNIQUE(user_id, topic_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attempts_user ON user_quiz_attempts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON user_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON user_quiz_attempts(status);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_topic ON user_topic_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_progress_percentage ON user_topic_progress(progress_percentage);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_topic ON user_bookmarks(topic_id);

-- ============================================================
-- VERIFICATION: Check if tables exist
-- ============================================================
SELECT
  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_quiz_attempts')
    THEN '✓ user_quiz_attempts exists'
    ELSE '✗ user_quiz_attempts missing'
  END as table_1,
  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_topic_progress')
    THEN '✓ user_topic_progress exists'
    ELSE '✗ user_topic_progress missing'
  END as table_2,
  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_bookmarks')
    THEN '✓ user_bookmarks exists'
    ELSE '✗ user_bookmarks missing'
  END as table_3;

-- Count records in each table
SELECT
  (SELECT COUNT(*) FROM user_quiz_attempts) as quiz_attempts_count,
  (SELECT COUNT(*) FROM user_topic_progress) as topic_progress_count,
  (SELECT COUNT(*) FROM user_bookmarks) as bookmarks_count;

SELECT 'User Analytics Tables Setup Complete!' as status;
