-- Fix: Add updated_at column if missing and recreate trigger
-- This fixes the "record new has no field updated_at" error

-- First, check if column exists and add if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_topic_progress'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_topic_progress
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

        RAISE NOTICE 'Added updated_at column to user_topic_progress table';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_update_topic_progress_timestamp ON user_topic_progress;
DROP FUNCTION IF EXISTS update_topic_progress_timestamp();

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION update_topic_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_update_topic_progress_timestamp
    BEFORE UPDATE ON user_topic_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_topic_progress_timestamp();

-- Verify the fix
SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_topic_progress'
AND column_name = 'updated_at';

COMMENT ON COLUMN user_topic_progress.updated_at IS 'Timestamp of last update';
