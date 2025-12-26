-- Add profile_picture column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN users.profile_picture IS 'Path to user profile picture stored in /uploads/profile-pictures/';
