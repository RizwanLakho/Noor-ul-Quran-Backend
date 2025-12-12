-- Migration script to update users table from username to first_name and last_name
-- Run this script to migrate your existing database

-- Step 1: Add new columns (with default values for existing records)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);

-- Step 2: For existing users, you may want to split username into first_name and last_name
-- This is a temporary solution - you may need to manually update these values
UPDATE users
SET
  first_name = COALESCE(first_name, SPLIT_PART(username, ' ', 1)),
  last_name = COALESCE(last_name, SPLIT_PART(username, ' ', 2))
WHERE first_name IS NULL OR last_name IS NULL;

-- If username didn't have a space, use it as first_name
UPDATE users
SET last_name = 'User'
WHERE last_name IS NULL OR last_name = '';

-- Step 3: Make the columns NOT NULL after populating them
ALTER TABLE users
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Step 4: (OPTIONAL) Drop the username column and its unique constraint
-- WARNING: Only run this after confirming all data is migrated correctly
-- ALTER TABLE users DROP COLUMN IF EXISTS username;

-- Note: After running this migration, you may want to manually update
-- the first_name and last_name values for existing users to their actual names
