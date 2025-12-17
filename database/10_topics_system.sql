-- ============================================================
-- TOPICS SYSTEM: Complete Database Schema
-- Features: Topics, Progress Tracking, Bookmarks, Categories
-- ============================================================

-- ============================================================
-- TABLE 1: topics
-- Curated collections created by superusers
-- ============================================================
DROP TABLE IF EXISTS user_topic_progress CASCADE;
DROP TABLE IF EXISTS user_bookmarks CASCADE;
DROP TABLE IF EXISTS topic_hadith CASCADE;
DROP TABLE IF EXISTS topic_ayahs CASCADE;
DROP TABLE IF EXISTS topics CASCADE;

CREATE TABLE topics (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),  -- 'prayer', 'patience', 'charity', 'knowledge', etc.
  icon VARCHAR(50) DEFAULT 'book',  -- Icon name for UI
  color VARCHAR(7) DEFAULT '#3B82F6',  -- Hex color
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: topic_ayahs
-- Ayahs included in each topic
-- ============================================================
CREATE TABLE topic_ayahs (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  sura INTEGER NOT NULL,
  aya INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  added_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate ayahs in same topic
  UNIQUE(topic_id, sura, aya)
);

-- ============================================================
-- TABLE 3: topic_hadith
-- Hadith included in each topic
-- ============================================================
CREATE TABLE topic_hadith (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  hadith_text TEXT NOT NULL,
  hadith_arabic TEXT,
  source VARCHAR(200),  -- "Sahih Bukhari 52", "Sahih Muslim 2999"
  narrator VARCHAR(100),  -- "Abu Huraira", "Aisha"
  authenticity VARCHAR(50) DEFAULT 'Sahih',  -- Sahih, Hasan, Daif
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  added_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 4: user_topic_progress
-- Track reading progress for each user
-- ============================================================
CREATE TABLE user_topic_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  
  -- Progress metrics
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Item tracking (PostgreSQL arrays)
  ayahs_read INTEGER[] DEFAULT '{}',
  hadith_read INTEGER[] DEFAULT '{}',
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Analytics
  view_count INTEGER DEFAULT 1,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- One progress record per user per topic
  UNIQUE(user_id, topic_id)
);

-- ============================================================
-- TABLE 5: user_bookmarks
-- Favorite topics bookmarked by users
-- ============================================================
CREATE TABLE user_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- One bookmark per user per topic
  UNIQUE(user_id, topic_id)
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================

-- Topics indexes
CREATE INDEX idx_topics_active ON topics(is_active, display_order);
CREATE INDEX idx_topics_category ON topics(category, is_active);
CREATE INDEX idx_topics_view_count ON topics(view_count DESC);

-- Topic ayahs indexes
CREATE INDEX idx_topic_ayahs_topic ON topic_ayahs(topic_id, display_order);
CREATE INDEX idx_topic_ayahs_sura_aya ON topic_ayahs(sura, aya);

-- Topic hadith indexes
CREATE INDEX idx_topic_hadith_topic ON topic_hadith(topic_id, display_order);

-- Progress indexes
CREATE INDEX idx_progress_user ON user_topic_progress(user_id);
CREATE INDEX idx_progress_topic ON user_topic_progress(topic_id);
CREATE INDEX idx_progress_percentage ON user_topic_progress(progress_percentage);
CREATE INDEX idx_progress_completed ON user_topic_progress(user_id, completed_at);

-- Bookmarks indexes
CREATE INDEX idx_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX idx_bookmarks_topic ON user_bookmarks(topic_id);

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- Sample Topic 1: Patience in Islam
INSERT INTO topics (title, description, category, icon, color, display_order, is_active) VALUES
('Patience in Islam', 'Learn about Sabr (patience) from Quran and Hadith', 'spirituality', 'heart', '#10B981', 1, true);

-- Add ayahs to topic
INSERT INTO topic_ayahs (topic_id, sura, aya, display_order) VALUES
(1, 2, 153, 1),
(1, 2, 155, 2),
(1, 3, 200, 3);

-- Add hadith to topic
INSERT INTO topic_hadith (topic_id, hadith_text, source, narrator, authenticity, display_order) VALUES
(1, 'The believer''s affair is amazing, for it is all good, and this is only for the believer. If something good happens to him, he is grateful, and that is good for him. If something bad happens to him, he bears it with patience, and that is good for him.', 'Sahih Muslim 2999', 'Suhaib', 'Sahih', 1);

-- Sample Topic 2: Importance of Prayer
INSERT INTO topics (title, description, category, icon, color, display_order, is_active) VALUES
('Importance of Prayer', 'Understanding Salah through verses and hadith', 'worship', 'mosque', '#3B82F6', 2, true);

INSERT INTO topic_ayahs (topic_id, sura, aya, display_order) VALUES
(2, 2, 43, 1),
(2, 2, 45, 2),
(2, 4, 103, 3);

INSERT INTO topic_hadith (topic_id, hadith_text, source, narrator, authenticity, display_order) VALUES
(2, 'Prayer is the pillar of religion. Whoever establishes it has established religion, and whoever abandons it has demolished religion.', 'Tabarani', 'Umar ibn al-Khattab', 'Hasan', 1);

-- ============================================================
-- FUNCTIONS for Progress Calculation (Optional but recommended)
-- ============================================================

CREATE OR REPLACE FUNCTION update_topic_progress()
RETURNS TRIGGER AS $$
BEGIN
  NEW.progress_percentage := (NEW.completed_items::DECIMAL / NULLIF(NEW.total_items, 0)) * 100;
  
  -- Mark as completed if 100%
  IF NEW.progress_percentage >= 100 AND NEW.completed_at IS NULL THEN
    NEW.completed_at := CURRENT_TIMESTAMP;
    
    -- Increment topic completion count
    UPDATE topics 
    SET completion_count = completion_count + 1 
    WHERE id = NEW.topic_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_progress
BEFORE UPDATE ON user_topic_progress
FOR EACH ROW
EXECUTE FUNCTION update_topic_progress();

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================
SELECT 'Topics System Database Setup Complete!' AS status;
SELECT COUNT(*) AS total_topics FROM topics;
SELECT COUNT(*) AS total_ayahs_in_topics FROM topic_ayahs;
SELECT COUNT(*) AS total_hadith_in_topics FROM topic_hadith;

