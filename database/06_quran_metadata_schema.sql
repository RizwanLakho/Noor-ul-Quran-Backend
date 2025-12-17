-- Quran Metadata Tables
-- Source: Tanzil.info (Creative Commons Attribution 3.0)
-- Contains: Hizb Quarters, Manzils, Rukus, Pages, Sajdas

-- =====================================================
-- Hizb Quarters Table (240 quarters in 60 Hizbs)
-- =====================================================
CREATE TABLE IF NOT EXISTS hizb_quarters (
  id SERIAL PRIMARY KEY,
  hizb_quarter_number INTEGER UNIQUE NOT NULL,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  hizb_number INTEGER GENERATED ALWAYS AS ((hizb_quarter_number - 1) / 4 + 1) STORED,
  quarter_in_hizb INTEGER GENERATED ALWAYS AS ((hizb_quarter_number - 1) % 4 + 1) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (surah_number) REFERENCES surahs(surah_number) ON DELETE CASCADE
);

CREATE INDEX idx_hizb_quarters_number ON hizb_quarters(hizb_quarter_number);
CREATE INDEX idx_hizb_quarters_surah ON hizb_quarters(surah_number);
CREATE INDEX idx_hizb_quarters_hizb ON hizb_quarters(hizb_number);

-- =====================================================
-- Manzils Table (7 sections for weekly reading)
-- =====================================================
CREATE TABLE IF NOT EXISTS manzils (
  id SERIAL PRIMARY KEY,
  manzil_number INTEGER UNIQUE NOT NULL CHECK (manzil_number BETWEEN 1 AND 7),
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  manzil_name_arabic VARCHAR(100),
  manzil_name_english VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (surah_number) REFERENCES surahs(surah_number) ON DELETE CASCADE
);

CREATE INDEX idx_manzils_number ON manzils(manzil_number);
CREATE INDEX idx_manzils_surah ON manzils(surah_number);

-- =====================================================
-- Rukus Table (556 sections/paragraphs)
-- =====================================================
CREATE TABLE IF NOT EXISTS rukus (
  id SERIAL PRIMARY KEY,
  ruku_number INTEGER UNIQUE NOT NULL,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (surah_number) REFERENCES surahs(surah_number) ON DELETE CASCADE
);

CREATE INDEX idx_rukus_number ON rukus(ruku_number);
CREATE INDEX idx_rukus_surah ON rukus(surah_number);

-- =====================================================
-- Pages Table (604 pages in Madani Mushaf)
-- =====================================================
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  page_number INTEGER UNIQUE NOT NULL CHECK (page_number BETWEEN 1 AND 604),
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  juz_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (surah_number) REFERENCES surahs(surah_number) ON DELETE CASCADE
);

CREATE INDEX idx_pages_number ON pages(page_number);
CREATE INDEX idx_pages_surah ON pages(surah_number);
CREATE INDEX idx_pages_juz ON pages(juz_number);

-- =====================================================
-- Sajdas Table (15 prostration verses)
-- =====================================================
CREATE TABLE IF NOT EXISTS sajdas (
  id SERIAL PRIMARY KEY,
  sajda_number INTEGER UNIQUE NOT NULL CHECK (sajda_number BETWEEN 1 AND 15),
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  sajda_type VARCHAR(20) NOT NULL CHECK (sajda_type IN ('recommended', 'obligatory')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (surah_number) REFERENCES surahs(surah_number) ON DELETE CASCADE
);

CREATE INDEX idx_sajdas_number ON sajdas(sajda_number);
CREATE INDEX idx_sajdas_surah ON sajdas(surah_number);
CREATE INDEX idx_sajdas_type ON sajdas(sajda_type);

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE hizb_quarters IS '240 Hizb quarters (Rub al-Hizb) for Quran division';
COMMENT ON TABLE manzils IS '7 Manzils for weekly Quran reading schedule';
COMMENT ON TABLE rukus IS '556 Rukus (paragraphs/sections) in the Quran';
COMMENT ON TABLE pages IS '604 pages in the standard Madani Mushaf';
COMMENT ON TABLE sajdas IS '15 prostration verses in the Quran';
