-- =====================================================
-- Word-by-Word Quran Table
-- =====================================================
-- Stores individual Arabic words from the Quran
-- for word-by-word display and study
-- =====================================================

CREATE TABLE IF NOT EXISTS quran_words (
  id SERIAL PRIMARY KEY,
  surah_number INTEGER NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  ayah_number INTEGER NOT NULL,
  word_position INTEGER NOT NULL,
  location VARCHAR(20) NOT NULL UNIQUE, -- Format: "surah:ayah:word" (e.g., "1:1:1")
  arabic_text VARCHAR(255) NOT NULL,
  transliteration VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure reference integrity
  FOREIGN KEY (surah_number) REFERENCES surahs(surah_number) ON DELETE CASCADE
);

-- Indexes for fast lookups
CREATE INDEX idx_words_surah_ayah ON quran_words(surah_number, ayah_number);
CREATE INDEX idx_words_location ON quran_words(location);
CREATE INDEX idx_words_surah ON quran_words(surah_number);

-- =====================================================
-- Word-by-Word Translations Table
-- =====================================================
-- Stores translations for each word in multiple languages
-- =====================================================

CREATE TABLE IF NOT EXISTS word_translations (
  id SERIAL PRIMARY KEY,
  word_id INTEGER NOT NULL,
  language_code VARCHAR(10) NOT NULL, -- 'en', 'ur', 'id', etc.
  translation TEXT NOT NULL,
  transliteration VARCHAR(255),
  root_word VARCHAR(100), -- Arabic root word for reference
  meaning_context TEXT, -- Additional context/grammar notes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (word_id) REFERENCES quran_words(id) ON DELETE CASCADE,
  UNIQUE(word_id, language_code)
);

-- Index for fast language-based lookups
CREATE INDEX idx_word_trans_language ON word_translations(word_id, language_code);
CREATE INDEX idx_word_trans_word ON word_translations(word_id);

COMMENT ON TABLE quran_words IS 'Individual Arabic words from the Quran for word-by-word study';
COMMENT ON TABLE word_translations IS 'Translations of Quranic words in multiple languages';
COMMENT ON COLUMN quran_words.location IS 'Unique location identifier in format surah:ayah:word';
COMMENT ON COLUMN word_translations.root_word IS 'Arabic root word for linguistic reference';
COMMENT ON COLUMN word_translations.meaning_context IS 'Grammar notes and contextual meaning';
