-- =====================================================
-- Base Quran Schema - Surahs and Ayahs Tables
-- This must run BEFORE other Quran metadata tables
-- =====================================================

-- Create Surahs table
CREATE TABLE IF NOT EXISTS surahs (
  id SERIAL PRIMARY KEY,
  surah_number INTEGER UNIQUE NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  surah_name_arabic VARCHAR(255) NOT NULL,
  surah_name_english VARCHAR(255) NOT NULL,
  total_ayahs INTEGER NOT NULL,
  revelation_type VARCHAR(50) CHECK (revelation_type IN ('Meccan', 'Medinan')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_surahs_number ON surahs(surah_number);
CREATE INDEX idx_surahs_revelation ON surahs(revelation_type);

-- Create Ayahs table
CREATE TABLE IF NOT EXISTS ayahs (
  id SERIAL PRIMARY KEY,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  ayah_text_arabic TEXT NOT NULL,
  juz_number INTEGER,
  hizb_number INTEGER,
  page_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(surah_number, ayah_number),
  FOREIGN KEY (surah_number) REFERENCES surahs(surah_number) ON DELETE CASCADE
);

CREATE INDEX idx_ayahs_surah ON ayahs(surah_number);
CREATE INDEX idx_ayahs_juz ON ayahs(juz_number);
CREATE INDEX idx_ayahs_page ON ayahs(page_number);
CREATE INDEX idx_ayahs_surah_ayah ON ayahs(surah_number, ayah_number);

COMMENT ON TABLE surahs IS '114 Surahs (chapters) of the Quran';
COMMENT ON TABLE ayahs IS 'Ayahs (verses) of the Quran';
