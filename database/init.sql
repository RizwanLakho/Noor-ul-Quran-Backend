-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (role_name, description, permissions) VALUES
('superuser', 'Full system access', '["all"]'),
('admin', 'Manage content', '["manage_translations", "manage_topics", "manage_quizzes", "view_analytics"]'),
('moderator', 'Review and approve', '["approve_translations", "moderate_content"]'),
('editor', 'Edit content', '["edit_translations", "edit_tafseer"]'),
('user', 'Regular user', '["view_content", "take_quizzes"]')
ON CONFLICT (role_name) DO NOTHING;

-- Update users table to add role_id
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) DEFAULT 5;
