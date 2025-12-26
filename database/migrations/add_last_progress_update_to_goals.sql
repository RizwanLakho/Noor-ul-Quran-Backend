-- ============================================================
-- Add last_progress_update column to user_reading_goals table
-- For tracking when a goal had progress last made
-- ============================================================

-- Add last_progress_update column if it doesn't exist
ALTER TABLE user_reading_goals
ADD COLUMN IF NOT EXISTS last_progress_update TIMESTAMP;

-- Add index for better query performance when checking for inactive goals
CREATE INDEX IF NOT EXISTS idx_reading_goals_last_progress_update ON user_reading_goals(last_progress_update);

-- Add comment for documentation
COMMENT ON COLUMN user_reading_goals.last_progress_update IS 'Timestamp of the last progress update on this goal (for reminder notifications)';
