-- Migration to add first_name and last_name columns
-- Run this as the postgres superuser

\c myapp_db

-- Step 1: Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);

-- Step 2: Migrate existing data (if any users exist with username)
UPDATE users
SET
  first_name = COALESCE(first_name, SPLIT_PART(username, ' ', 1)),
  last_name = COALESCE(last_name, CASE
    WHEN SPLIT_PART(username, ' ', 2) = '' THEN 'User'
    ELSE SPLIT_PART(username, ' ', 2)
  END)
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 3: For any remaining NULL values (shouldn't happen, but just in case)
UPDATE users SET first_name = 'User' WHERE first_name IS NULL;
UPDATE users SET last_name = 'User' WHERE last_name IS NULL;

-- Step 4: Make columns NOT NULL
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

\echo '✅ Migration completed successfully!'
