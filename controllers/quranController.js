const pool = require("../config/db");
const { normalizeArabic } = require("../utils/arabicHelper");

// Get all surahs with proper names
exports.getAllSurahs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT surah_number, surah_name_arabic, surah_name_english,
              total_ayahs, revelation_type
       FROM surahs
       ORDER BY surah_number`,
    );

    res.json({
      success: true,
      total_surahs: result.rows.length,
      surahs: result.rows,
    });
  } catch (err) {
    console.error("Get surahs error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get single surah with metadata and all ayahs
exports.getSurahById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get surah info
    const surahInfo = await pool.query(
      "SELECT * FROM surahs WHERE surah_number = $1",
      [id],
    );

    if (surahInfo.rows.length === 0) {
      return res.status(404).json({ error: "Surah not found" });
    }

    // Get all ayahs
    const ayahs = await pool.query(
      "SELECT index, sura, aya, text FROM quran_text WHERE sura = $1 ORDER BY aya",
      [id],
    );

    res.json({
      success: true,
      surah: surahInfo.rows[0],
      ayahs: ayahs.rows,
    });
  } catch (err) {
    console.error("Get surah error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get specific ayah
exports.getAyah = async (req, res) => {
  try {
    const { surah, ayah } = req.params;

    // Get surah info
    const surahInfo = await pool.query(
      "SELECT surah_name_arabic, surah_name_english FROM surahs WHERE surah_number = $1",
      [surah],
    );

    // Get ayah
    const ayahData = await pool.query(
      "SELECT index, sura, aya, text FROM quran_text WHERE sura = $1 AND aya = $2",
      [surah, ayah],
    );

    if (ayahData.rows.length === 0) {
      return res.status(404).json({ error: "Ayah not found" });
    }

    res.json({
      success: true,
      surah_info: surahInfo.rows[0],
      ayah: ayahData.rows[0],
    });
  } catch (err) {
    console.error("Get ayah error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get ayahs by range
exports.getAyahsByRange = async (req, res) => {
  try {
    const { surah, from, to } = req.params;

    // Get surah info
    const surahInfo = await pool.query(
      "SELECT * FROM surahs WHERE surah_number = $1",
      [surah],
    );

    if (surahInfo.rows.length === 0) {
      return res.status(404).json({ error: "Surah not found" });
    }

    // Get ayahs
    const ayahs = await pool.query(
      "SELECT index, sura, aya, text FROM quran_text WHERE sura = $1 AND aya BETWEEN $2 AND $3 ORDER BY aya",
      [surah, from, to],
    );

    if (ayahs.rows.length === 0) {
      return res.status(404).json({ error: "No ayahs found in this range" });
    }

    res.json({
      success: true,
      surah: surahInfo.rows[0],
      ayahs: ayahs.rows,
    });
  } catch (err) {
    console.error("Get range error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Search in Quran
exports.searchQuran = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: "Search query must be at least 2 characters",
        example: "/api/quran/search?q=الله&page=1&limit=20",
      });
    }

    const searchTerm = q.trim();
    const normalizedSearch = normalizeArabic(searchTerm);

    // Parse pagination params
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    // First, get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM quran_text qt
       WHERE
         REGEXP_REPLACE(
           REGEXP_REPLACE(
             REGEXP_REPLACE(
               REGEXP_REPLACE(qt.text, '[ًٌٍَُِّْٰ٠-٩]', '', 'g'),
               '[أإآٱ]', 'ا', 'g'
             ),
             'ة', 'ه', 'g'
           ),
           'ى', 'ي', 'g'
         ) LIKE $1`,
      [`%${normalizedSearch}%`],
    );

    const totalResults = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalResults / limitNum);
    const hasMore = pageNum < totalPages;

    // Normalize text in SQL using REGEXP_REPLACE for flexible Arabic search
    // Remove diacritics, normalize Alef forms, normalize Taa Marboota and Yaa
    const result = await pool.query(
      `SELECT qt.index, qt.sura, qt.aya, qt.text,
              s.surah_name_arabic, s.surah_name_english,
              tr.text as translation, tr.translator, tr.language
       FROM quran_text qt
       JOIN surahs s ON qt.sura = s.surah_number
       LEFT JOIN quran_translation tr ON qt.sura = tr.sura AND qt.aya = tr.aya AND tr.language = 'en'
       WHERE
         REGEXP_REPLACE(
           REGEXP_REPLACE(
             REGEXP_REPLACE(
               REGEXP_REPLACE(qt.text, '[ًٌٍَُِّْٰ٠-٩]', '', 'g'),
               '[أإآٱ]', 'ا', 'g'
             ),
             'ة', 'ه', 'g'
           ),
           'ى', 'ي', 'g'
         ) LIKE $1
       ORDER BY qt.sura, qt.aya
       LIMIT $2 OFFSET $3`,
      [`%${normalizedSearch}%`, limitNum, offset],
    );

    res.json({
      success: true,
      query: searchTerm,
      normalized_query: normalizedSearch,
      pagination: {
        current_page: pageNum,
        per_page: limitNum,
        total_results: totalResults,
        total_pages: totalPages,
        has_more: hasMore,
      },
      results: result.rows,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
};

// Get random ayah
exports.getRandomAyah = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT qt.index, qt.sura, qt.aya, qt.text,
              s.surah_name_arabic, s.surah_name_english
       FROM quran_text qt
       JOIN surahs s ON qt.sura = s.surah_number
       ORDER BY RANDOM() LIMIT 1`,
    );

    res.json({
      success: true,
      ayah: result.rows[0],
    });
  } catch (err) {
    console.error("Random ayah error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get stats
exports.getStats = async (req, res) => {
  try {
    const totalAyahs = await pool.query("SELECT COUNT(*) FROM quran_text");
    const totalSurahs = await pool.query("SELECT COUNT(*) FROM surahs");
    const meccanSurahs = await pool.query(
      "SELECT COUNT(*) FROM surahs WHERE revelation_type = 'Meccan'",
    );
    const medinanSurahs = await pool.query(
      "SELECT COUNT(*) FROM surahs WHERE revelation_type = 'Medinan'",
    );

    const longestSurah = await pool.query(
      "SELECT surah_number, surah_name_english, total_ayahs FROM surahs ORDER BY total_ayahs DESC LIMIT 1",
    );
    const shortestSurah = await pool.query(
      "SELECT surah_number, surah_name_english, total_ayahs FROM surahs ORDER BY total_ayahs ASC LIMIT 1",
    );

    res.json({
      success: true,
      stats: {
        total_ayahs: parseInt(totalAyahs.rows[0].count),
        total_surahs: parseInt(totalSurahs.rows[0].count),
        meccan_surahs: parseInt(meccanSurahs.rows[0].count),
        medinan_surahs: parseInt(medinanSurahs.rows[0].count),
        longest_surah: longestSurah.rows[0],
        shortest_surah: shortestSurah.rows[0],
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
