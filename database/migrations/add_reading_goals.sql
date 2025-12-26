-- ============================================================
-- READING GOALS SYSTEM
-- ============================================================

-- Main table for storing user reading goals
CREATE TABLE IF NOT EXISTS user_reading_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_value INTEGER NOT NULL,
  duration_unit VARCHAR(10) NOT NULL CHECK (duration_unit IN ('days', 'weeks', 'months', 'year')),
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing goal targets (Surahs)
CREATE TABLE IF NOT EXISTS user_reading_goal_surah_targets (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES user_reading_goals(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  surah_name VARCHAR(255),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing goal targets (Juz)
CREATE TABLE IF NOT EXISTS user_reading_goal_juz_targets (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES user_reading_goals(id) ON DELETE CASCADE,
  juz_number INTEGER NOT NULL,
  juz_name VARCHAR(255),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing goal targets (Topics)
CREATE TABLE IF NOT EXISTS user_reading_goal_topic_targets (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES user_reading_goals(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL,
  topic_name VARCHAR(255),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reading_goals_user_id ON user_reading_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_goals_end_date ON user_reading_goals(end_date);
CREATE INDEX IF NOT EXISTS idx_reading_goals_completed ON user_reading_goals(completed);

CREATE INDEX IF NOT EXISTS idx_surah_targets_goal_id ON user_reading_goal_surah_targets(goal_id);
CREATE INDEX IF NOT EXISTS idx_juz_targets_goal_id ON user_reading_goal_juz_targets(goal_id);
CREATE INDEX IF NOT EXISTS idx_topic_targets_goal_id ON user_reading_goal_topic_targets(goal_id);

-- Comments for documentation
COMMENT ON TABLE user_reading_goals IS 'Stores user reading goals with custom duration';
COMMENT ON TABLE user_reading_goal_surah_targets IS 'Stores Surah targets for each reading goal';
COMMENT ON TABLE user_reading_goal_juz_targets IS 'Stores Juz targets for each reading goal';
COMMENT ON TABLE user_reading_goal_topic_targets IS 'Stores Topic targets for each reading goal';

COMMENT ON COLUMN user_reading_goals.duration_unit IS 'Unit of time: days, weeks, months, or year';
COMMENT ON COLUMN user_reading_goals.end_date IS 'Calculated end date based on start_date + duration';
