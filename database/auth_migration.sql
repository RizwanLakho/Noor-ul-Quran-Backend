-- =====================================================
-- Authentication System Migration
-- Run this file to add all authentication features
-- =====================================================

-- Add new columns to users table for email verification
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Create audit log table for security
CREATE TABLE IF NOT EXISTS user_login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  login_time TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  failure_reason VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON user_login_history(user_id, login_time DESC);

-- Create email verification log
CREATE TABLE IF NOT EXISTS email_verification_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_verification_log_user ON email_verification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_log_token ON email_verification_log(token);

-- Update existing users to be verified (optional - for development)
-- Comment this out in production if you want to require verification
-- UPDATE users SET email_verified = TRUE WHERE email_verified IS FALSE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Authentication migration completed successfully!';
  RAISE NOTICE '📧 Email verification system ready';
  RAISE NOTICE '🔐 OAuth support enabled';
  RAISE NOTICE '📊 Login history tracking enabled';
END $$;
