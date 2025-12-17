-- User Topic Progress Tracking Schema
-- This table tracks user progress while reading topics

CREATE TABLE IF NOT EXISTS user_topic_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    progress_percentage NUMERIC(5, 2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    scroll_position INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, topic_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_id ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_topic_id ON user_topic_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_completed ON user_topic_progress(is_completed);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_topic_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_topic_progress_timestamp
    BEFORE UPDATE ON user_topic_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_topic_progress_timestamp();

-- Add comments for documentation
COMMENT ON TABLE user_topic_progress IS 'Tracks user reading progress for topics';
COMMENT ON COLUMN user_topic_progress.progress_percentage IS 'Percentage of topic content read (0-100)';
COMMENT ON COLUMN user_topic_progress.scroll_position IS 'Last scroll position in pixels';
COMMENT ON COLUMN user_topic_progress.is_completed IS 'Whether user has completed reading this topic';
