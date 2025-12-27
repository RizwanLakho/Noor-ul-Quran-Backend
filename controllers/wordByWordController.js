/**
 * Word-by-Word Controller
 * Handles word-by-word Quran data endpoints
 */

const pool = require('../config/db');

/**
 * Get word-by-word data for a specific ayah
 * GET /api/word-by-word/:surahNumber/:ayahNumber
 */
exports.getAyahWords = async (req, res) => {
  try {
    const { surahNumber, ayahNumber } = req.params;

    // Validate parameters
    if (!surahNumber || !ayahNumber) {
      return res.status(400).json({
        success: false,
        message: 'Surah number and ayah number are required',
      });
    }

    // Fetch words for the ayah with translations
    const query = `
      SELECT
        qw.id,
        qw.surah_number,
        qw.ayah_number,
        qw.word_position,
        qw.location,
        qw.arabic_text,
        qw.transliteration,
        wt.translation,
        wt.language_code
      FROM quran_words qw
      LEFT JOIN word_translations wt ON qw.id = wt.word_id AND wt.language_code = 'en'
      WHERE qw.surah_number = $1 AND qw.ayah_number = $2
      ORDER BY qw.word_position ASC
    `;

    const result = await pool.query(query, [surahNumber, ayahNumber]);

    res.json({
      success: true,
      surahNumber: parseInt(surahNumber),
      ayahNumber: parseInt(ayahNumber),
      wordCount: result.rows.length,
      words: result.rows,
    });
  } catch (error) {
    console.error('Error fetching ayah words:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch word-by-word data',
      error: error.message,
    });
  }
};

/**
 * Get word-by-word data for entire surah
 * GET /api/word-by-word/surah/:surahNumber
 */
exports.getSurahWords = async (req, res) => {
  try {
    const { surahNumber } = req.params;

    if (!surahNumber) {
      return res.status(400).json({
        success: false,
        message: 'Surah number is required',
      });
    }

    // Fetch all words for the surah with translations
    const query = `
      SELECT
        qw.id,
        qw.surah_number,
        qw.ayah_number,
        qw.word_position,
        qw.location,
        qw.arabic_text,
        qw.transliteration,
        wt.translation,
        wt.language_code
      FROM quran_words qw
      LEFT JOIN word_translations wt ON qw.id = wt.word_id AND wt.language_code = 'en'
      WHERE qw.surah_number = $1
      ORDER BY qw.ayah_number ASC, qw.word_position ASC
    `;

    const result = await pool.query(query, [surahNumber]);

    // Group words by ayah
    const ayahs = {};
    result.rows.forEach((word) => {
      const ayahKey = word.ayah_number;
      if (!ayahs[ayahKey]) {
        ayahs[ayahKey] = [];
      }
      ayahs[ayahKey].push(word);
    });

    res.json({
      success: true,
      surahNumber: parseInt(surahNumber),
      totalWords: result.rows.length,
      totalAyahs: Object.keys(ayahs).length,
      ayahs: ayahs,
    });
  } catch (error) {
    console.error('Error fetching surah words:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch surah word-by-word data',
      error: error.message,
    });
  }
};

/**
 * Get word translations
 * GET /api/word-by-word/word/:wordId/translations
 */
exports.getWordTranslations = async (req, res) => {
  try {
    const { wordId } = req.params;
    const { language } = req.query; // Optional language filter

    let query = `
      SELECT
        wt.id,
        wt.word_id,
        wt.language_code,
        wt.translation,
        wt.transliteration,
        wt.root_word,
        wt.meaning_context,
        qw.arabic_text,
        qw.location
      FROM word_translations wt
      JOIN quran_words qw ON wt.word_id = qw.id
      WHERE wt.word_id = $1
    `;

    const params = [wordId];

    if (language) {
      query += ' AND wt.language_code = $2';
      params.push(language);
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      wordId: parseInt(wordId),
      translations: result.rows,
    });
  } catch (error) {
    console.error('Error fetching word translations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch word translations',
      error: error.message,
    });
  }
};

/**
 * Get word-by-word stats
 * GET /api/word-by-word/stats
 */
exports.getStats = async (req, res) => {
  try {
    const query = `
      SELECT
        COUNT(*) as total_words,
        COUNT(DISTINCT surah_number) as total_surahs,
        COUNT(DISTINCT CONCAT(surah_number, ':', ayah_number)) as total_ayahs,
        COUNT(DISTINCT transliteration) FILTER (WHERE transliteration IS NOT NULL) as words_with_transliteration
      FROM quran_words
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      stats: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};
