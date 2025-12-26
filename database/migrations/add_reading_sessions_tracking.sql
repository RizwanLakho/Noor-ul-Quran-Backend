-- ============================================================
-- READING SESSIONS TRACKING TABLES
-- ============================================================

-- Table to store individual reading sessions
CREATE TABLE IF NOT EXISTS reading_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('surah', 'juz', 'topic')),
  surah_number INTEGER,
  juz_number INTEGER,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  ayahs_read INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  last_ayah_read INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_created_at ON reading_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_type ON reading_sessions(session_type);

-- Table to store user engagement statistics (aggregated data)
CREATE TABLE IF NOT EXISTS user_engagement_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  verses_recited INTEGER NOT NULL DEFAULT 0,
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for engagement stats
CREATE INDEX IF NOT EXISTS idx_user_engagement_user_id ON user_engagement_stats(user_id);

-- Comments
COMMENT ON TABLE reading_sessions IS 'Stores individual Quran reading sessions for detailed tracking';
COMMENT ON TABLE user_engagement_stats IS 'Aggregated user engagement statistics for quick access';
COMMENT ON COLUMN reading_sessions.session_type IS 'Type of reading: surah, juz, or topic';
COMMENT ON COLUMN reading_sessions.ayahs_read IS 'Number of ayahs read in this session';
COMMENT ON COLUMN reading_sessions.time_spent_seconds IS 'Time spent reading in seconds';
COMMENT ON COLUMN user_engagement_stats.verses_recited IS 'Total verses recited by user (lifetime)';
COMMENT ON COLUMN user_engagement_stats.total_time_seconds IS 'Total time spent reading (lifetime)';
