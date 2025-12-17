CREATE TABLE IF NOT EXISTS surahs (
  surah_number INTEGER PRIMARY KEY,
  surah_name_arabic VARCHAR(255) NOT NULL,
  surah_name_english VARCHAR(255) NOT NULL,
  total_ayahs INTEGER NOT NULL,
  revelation_type VARCHAR(20) NOT NULL
);
