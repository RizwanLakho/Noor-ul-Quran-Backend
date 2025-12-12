-- =====================================================
-- Juz Table (30 parts of the Quran)
-- =====================================================
-- Each Juz is approximately 1/30th of the Quran
-- Used for monthly or structured reading plans

CREATE TABLE IF NOT EXISTS juz (
  id SERIAL PRIMARY KEY,
  juz_number INTEGER UNIQUE NOT NULL CHECK (juz_number BETWEEN 1 AND 30),
  juz_name_arabic VARCHAR(255),
  juz_name_english VARCHAR(255),
  starting_surah INTEGER NOT NULL,
  starting_ayah INTEGER NOT NULL,
  ending_surah INTEGER NOT NULL,
  ending_ayah INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (starting_surah) REFERENCES surahs(surah_number) ON DELETE CASCADE,
  FOREIGN KEY (ending_surah) REFERENCES surahs(surah_number) ON DELETE CASCADE
);

CREATE INDEX idx_juz_number ON juz(juz_number);
CREATE INDEX idx_juz_starting_surah ON juz(starting_surah);
CREATE INDEX idx_juz_ending_surah ON juz(ending_surah);

COMMENT ON TABLE juz IS '30 Juz (parts) of the Quran for structured reading';

-- =====================================================
-- Insert Juz Data
-- =====================================================
-- Standard Juz divisions based on Madani Mushaf

INSERT INTO juz (juz_number, juz_name_arabic, juz_name_english, starting_surah, starting_ayah, ending_surah, ending_ayah) VALUES
(1, 'الجزء الأول', 'Alif Lam Mim', 1, 1, 2, 141),
(2, 'الجزء الثاني', 'Sayaqool', 2, 142, 2, 252),
(3, 'الجزء الثالث', 'Tilkal Rusul', 2, 253, 3, 92),
(4, 'الجزء الرابع', 'Lan Tana Loo', 3, 93, 4, 23),
(5, 'الجزء الخامس', 'Wal Mohsanat', 4, 24, 4, 147),
(6, 'الجزء السادس', 'La Yuhibbullah', 4, 148, 5, 81),
(7, 'الجزء السابع', 'Wa Iza Samioo', 5, 82, 6, 110),
(8, 'الجزء الثامن', 'Wa Lau Annana', 6, 111, 7, 87),
(9, 'الجزء التاسع', 'Qalal Malao', 7, 88, 8, 40),
(10, 'الجزء العاشر', 'Wa Alamoo', 8, 41, 9, 92),
(11, 'الجزء الحادي عشر', 'Yatazeroon', 9, 93, 11, 5),
(12, 'الجزء الثاني عشر', 'Wa Mamin Daabbah', 11, 6, 12, 52),
(13, 'الجزء الثالث عشر', 'Wa Ma Ubrioo', 12, 53, 14, 52),
(14, 'الجزء الرابع عشر', 'Rubama', 15, 1, 16, 128),
(15, 'الجزء الخامس عشر', 'Subhanal Lazi', 17, 1, 18, 74),
(16, 'الجزء السادس عشر', 'Qal Alam', 18, 75, 20, 135),
(17, 'الجزء السابع عشر', 'Iqtaraba Linnasi', 21, 1, 22, 78),
(18, 'الجزء الثامن عشر', 'Qadd Aflaha', 23, 1, 25, 20),
(19, 'الجزء التاسع عشر', 'Wa Qalallazina', 25, 21, 27, 55),
(20, 'الجزء العشرون', 'Amman Khalaqa', 27, 56, 29, 45),
(21, 'الجزء الحادي والعشرون', 'Utlu Ma Oohi', 29, 46, 33, 30),
(22, 'الجزء الثاني والعشرون', 'Wa Manyaqnut', 33, 31, 36, 27),
(23, 'الجزء الثالث والعشرون', 'Wa Mali', 36, 28, 39, 31),
(24, 'الجزء الرابع والعشرون', 'Faman Azlam', 39, 32, 41, 46),
(25, 'الجزء الخامس والعشرون', 'Ilayhi Yuraddu', 41, 47, 45, 37),
(26, 'الجزء السادس والعشرون', 'Ha Mim', 46, 1, 51, 30),
(27, 'الجزء السابع والعشرون', 'Qala Fama Khatbukum', 51, 31, 57, 29),
(28, 'الجزء الثامن والعشرون', 'Qad Samia Allah', 58, 1, 66, 12),
(29, 'الجزء التاسع والعشرون', 'Tabarakal Lazi', 67, 1, 77, 50),
(30, 'الجزء الثلاثون', 'Amma Yatasa Aloon', 78, 1, 114, 6)
ON CONFLICT (juz_number) DO NOTHING;
