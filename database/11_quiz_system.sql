-- ============================================================
-- QUIZ SYSTEM: Complete Database Schema
-- Features: Quizzes, Questions, Attempts, Review System
-- ============================================================

-- ============================================================
-- TABLE 1: quizzes
-- Quiz collections created by superusers
-- ============================================================
DROP TABLE IF EXISTS user_quiz_answers CASCADE;
DROP TABLE IF EXISTS user_quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;

CREATE TABLE quizzes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),  -- 'aqeedah', 'fiqh', 'seerah', 'hadith', 'quran', 'general'
  difficulty VARCHAR(20) DEFAULT 'medium',  -- 'easy', 'medium', 'hard'
  time_limit INTEGER DEFAULT 0,  -- 0 = no time limit (in minutes)
  passing_score INTEGER DEFAULT 60,  -- Percentage to pass
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  question_count INTEGER DEFAULT 0,

  -- Analytics
  total_attempts INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,

  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: quiz_questions
-- Questions in each quiz with options
-- ============================================================
CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_order INTEGER DEFAULT 0,
  points INTEGER DEFAULT 1,

  -- Options (A, B, C, D)
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,

  -- Correct answer: 'A', 'B', 'C', or 'D'
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),

  -- Explanation for the correct answer
  explanation TEXT,

  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 3: user_quiz_attempts
-- User's quiz attempts and results
-- ============================================================
CREATE TABLE user_quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  
  -- Results
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2) DEFAULT 0.00,
  passed BOOLEAN DEFAULT false,
  
  -- Time tracking
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  time_taken_seconds INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'in_progress',  -- 'in_progress', 'completed'
  can_review BOOLEAN DEFAULT true
);

-- ============================================================
-- TABLE 4: user_quiz_answers
-- Individual answers for review
-- ============================================================
CREATE TABLE user_quiz_answers (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES user_quiz_attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(attempt_id, question_id)
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================

-- Quizzes indexes
CREATE INDEX idx_quizzes_active ON quizzes(is_active, display_order);
CREATE INDEX idx_quizzes_category ON quizzes(category, is_active);

-- Questions indexes
CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id, question_order);

-- Attempts indexes
CREATE INDEX idx_attempts_user ON user_quiz_attempts(user_id, completed_at DESC);
CREATE INDEX idx_attempts_quiz ON user_quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_status ON user_quiz_attempts(status);

-- Answers indexes
CREATE INDEX idx_answers_attempt ON user_quiz_answers(attempt_id);
CREATE INDEX idx_answers_question ON user_quiz_answers(question_id);

-- ============================================================
-- SAMPLE DATA (For testing)
-- ============================================================

-- Sample Quiz 1: Tawheed
INSERT INTO quizzes (title, description, category, difficulty, time_limit, passing_score, is_active, question_count, display_order) VALUES
('Tawheed Quiz', 'Test your knowledge about the Oneness of Allah', 'aqeedah', 'easy', 15, 70, true, 5, 1);

-- Sample Questions for Tawheed Quiz
INSERT INTO quiz_questions (quiz_id, question_text, question_order, option_a, option_b, option_c, option_d, correct_answer) VALUES
(1, 'What is Tawheed?', 1, 'Oneness of Allah', 'Prayer', 'Fasting', 'Charity', 'A'),
(1, 'Who created everything?', 2, 'Nature', 'Allah', 'Humans', 'Science', 'B'),
(1, 'How many gods are there in Islam?', 3, 'None', 'One', 'Two', 'Many', 'B'),
(1, 'What is the first pillar of Islam?', 4, 'Prayer', 'Shahada (Testimony)', 'Fasting', 'Hajj', 'B'),
(1, 'Who is worthy of worship?', 5, 'Prophets', 'Angels', 'Allah alone', 'Saints', 'C');

-- Sample Quiz 2: Salah
INSERT INTO quizzes (title, description, category, difficulty, time_limit, passing_score, is_active, question_count, display_order) VALUES
('Salah (Prayer) Quiz', 'Test your knowledge about Islamic prayer', 'fiqh', 'medium', 20, 70, true, 4, 1);

-- Sample Questions for Salah Quiz
INSERT INTO quiz_questions (quiz_id, question_text, question_order, option_a, option_b, option_c, option_d, correct_answer) VALUES
(2, 'How many daily prayers are obligatory?', 1, 'Three', 'Four', 'Five', 'Six', 'C'),
(2, 'What is the first prayer of the day?', 2, 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'A'),
(2, 'How many rakats in Fajr prayer?', 3, 'Two', 'Three', 'Four', 'Five', 'A'),
(2, 'What do we say when we hear the Adhan?', 4, 'Nothing', 'Repeat after Muadhin', 'Say Takbeer', 'Say Salam', 'B');

-- ============================================================
-- TRIGGERS for Auto-calculation
-- ============================================================

-- Update quiz statistics when attempt completes
CREATE OR REPLACE FUNCTION update_quiz_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
    UPDATE quizzes 
    SET total_completions = total_completions + 1
    WHERE id = NEW.quiz_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_quiz_stats
AFTER UPDATE ON user_quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION update_quiz_stats();

-- Auto-increment total_attempts when user starts quiz
CREATE OR REPLACE FUNCTION increment_quiz_attempts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quizzes 
  SET total_attempts = total_attempts + 1
  WHERE id = NEW.quiz_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_attempts
AFTER INSERT ON user_quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION increment_quiz_attempts();

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================
SELECT 'Quiz System Database Setup Complete!' AS status;
SELECT COUNT(*) AS total_quizzes FROM quizzes;
SELECT COUNT(*) AS total_questions FROM quiz_questions;

