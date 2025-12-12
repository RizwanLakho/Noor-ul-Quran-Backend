const pool = require('../config/db');

// =====================================================
// HIZB QUARTERS
// =====================================================

/**
 * Get all Hizb Quarters
 * @route GET /api/quran/hizb-quarters
 */
const getAllHizbQuarters = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        hq.*,
        s.surah_name_arabic,
        s.surah_name_english
      FROM hizb_quarters hq
      LEFT JOIN surahs s ON hq.surah_number = s.surah_number
      ORDER BY hq.hizb_quarter_number
    `);

    res.json({
      success: true,
      total: result.rows.length,
      hizb_quarters: result.rows
    });
  } catch (err) {
    console.error('Get hizb quarters error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get specific Hizb Quarter by number
 * @route GET /api/quran/hizb-quarters/:number
 */
const getHizbQuarterByNumber = async (req, res) => {
  try {
    const { number } = req.params;

    const result = await pool.query(`
      SELECT
        hq.*,
        s.surah_name_arabic,
        s.surah_name_english,
        s.total_ayahs
      FROM hizb_quarters hq
      LEFT JOIN surahs s ON hq.surah_number = s.surah_number
      WHERE hq.hizb_quarter_number = $1
    `, [number]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hizb quarter not found' });
    }

    res.json({
      success: true,
      hizb_quarter: result.rows[0]
    });
  } catch (err) {
    console.error('Get hizb quarter error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Find Hizb Quarter for specific ayah
 * @route GET /api/quran/hizb-quarters/find/:surah/:ayah
 */
const findHizbQuarterForAyah = async (req, res) => {
  try {
    const { surah, ayah } = req.params;

    const result = await pool.query(`
      SELECT hq.*, s.surah_name_english, s.surah_name_arabic
      FROM hizb_quarters hq
      LEFT JOIN surahs s ON hq.surah_number = s.surah_number
      WHERE hq.id = (
        SELECT id FROM hizb_quarters
        WHERE (surah_number < $1) OR (surah_number = $1 AND ayah_number <= $2)
        ORDER BY surah_number DESC, ayah_number DESC
        LIMIT 1
      )
    `, [surah, ayah]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hizb quarter not found for this ayah' });
    }

    res.json({
      success: true,
      surah: parseInt(surah),
      ayah: parseInt(ayah),
      hizb_quarter: result.rows[0]
    });
  } catch (err) {
    console.error('Find hizb quarter error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// =====================================================
// MANZILS
// =====================================================

/**
 * Get all Manzils
 * @route GET /api/quran/manzils
 */
const getAllManzils = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.*,
        s.surah_name_arabic,
        s.surah_name_english
      FROM manzils m
      LEFT JOIN surahs s ON m.surah_number = s.surah_number
      ORDER BY m.manzil_number
    `);

    res.json({
      success: true,
      total: result.rows.length,
      manzils: result.rows
    });
  } catch (err) {
    console.error('Get manzils error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get specific Manzil by number
 * @route GET /api/quran/manzils/:number
 */
const getManzilByNumber = async (req, res) => {
  try {
    const { number } = req.params;

    const result = await pool.query(`
      SELECT
        m.*,
        s.surah_name_arabic,
        s.surah_name_english
      FROM manzils m
      LEFT JOIN surahs s ON m.surah_number = s.surah_number
      WHERE m.manzil_number = $1
    `, [number]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manzil not found' });
    }

    res.json({
      success: true,
      manzil: result.rows[0]
    });
  } catch (err) {
    console.error('Get manzil error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// =====================================================
// RUKUS
// =====================================================

/**
 * Get all Rukus
 * @route GET /api/quran/rukus
 */
const getAllRukus = async (req, res) => {
  try {
    const { surah } = req.query;

    let query = `
      SELECT
        r.*,
        s.surah_name_arabic,
        s.surah_name_english
      FROM rukus r
      LEFT JOIN surahs s ON r.surah_number = s.surah_number
    `;

    const params = [];
    if (surah) {
      query += ` WHERE r.surah_number = $1`;
      params.push(surah);
    }

    query += ` ORDER BY r.ruku_number`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      total: result.rows.length,
      rukus: result.rows
    });
  } catch (err) {
    console.error('Get rukus error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get specific Ruku by number
 * @route GET /api/quran/rukus/:number
 */
const getRukuByNumber = async (req, res) => {
  try {
    const { number } = req.params;

    const result = await pool.query(`
      SELECT
        r.*,
        s.surah_name_arabic,
        s.surah_name_english
      FROM rukus r
      LEFT JOIN surahs s ON r.surah_number = s.surah_number
      WHERE r.ruku_number = $1
    `, [number]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ruku not found' });
    }

    res.json({
      success: true,
      ruku: result.rows[0]
    });
  } catch (err) {
    console.error('Get ruku error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Find Ruku for specific ayah
 * @route GET /api/quran/rukus/find/:surah/:ayah
 */
const findRukuForAyah = async (req, res) => {
  try {
    const { surah, ayah } = req.params;

    const result = await pool.query(`
      SELECT r.*, s.surah_name_english, s.surah_name_arabic
      FROM rukus r
      LEFT JOIN surahs s ON r.surah_number = s.surah_number
      WHERE r.id = (
        SELECT id FROM rukus
        WHERE (surah_number < $1) OR (surah_number = $1 AND ayah_number <= $2)
        ORDER BY surah_number DESC, ayah_number DESC
        LIMIT 1
      )
    `, [surah, ayah]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ruku not found for this ayah' });
    }

    res.json({
      success: true,
      surah: parseInt(surah),
      ayah: parseInt(ayah),
      ruku: result.rows[0]
    });
  } catch (err) {
    console.error('Find ruku error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// =====================================================
// PAGES
// =====================================================

/**
 * Get all Pages
 * @route GET /api/quran/pages
 */
const getAllPages = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        s.surah_name_arabic,
        s.surah_name_english
      FROM pages p
      LEFT JOIN surahs s ON p.surah_number = s.surah_number
      ORDER BY p.page_number
    `);

    res.json({
      success: true,
      total: result.rows.length,
      pages: result.rows
    });
  } catch (err) {
    console.error('Get pages error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get specific Page by number
 * @route GET /api/quran/pages/:number
 */
const getPageByNumber = async (req, res) => {
  try {
    const { number } = req.params;

    const pageResult = await pool.query(`
      SELECT
        p.*,
        s.surah_name_arabic,
        s.surah_name_english
      FROM pages p
      LEFT JOIN surahs s ON p.surah_number = s.surah_number
      WHERE p.page_number = $1
    `, [number]);

    if (pageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Get next page to determine the range
    const nextPageResult = await pool.query(`
      SELECT surah_number, ayah_number
      FROM pages
      WHERE page_number = $1
    `, [parseInt(number) + 1]);

    const page = pageResult.rows[0];
    let endSurah, endAyah;

    if (nextPageResult.rows.length > 0) {
      endSurah = nextPageResult.rows[0].surah_number;
      endAyah = nextPageResult.rows[0].ayah_number - 1;

      // If next page starts at ayah 1, get last ayah of previous surah
      if (endAyah === 0) {
        const prevSurahResult = await pool.query(
          'SELECT total_ayahs FROM surahs WHERE surah_number = $1',
          [endSurah - 1]
        );
        endSurah = endSurah - 1;
        endAyah = prevSurahResult.rows[0].total_ayahs;
      }
    } else {
      // Last page
      endSurah = 114;
      const lastSurahResult = await pool.query(
        'SELECT total_ayahs FROM surahs WHERE surah_number = 114'
      );
      endAyah = lastSurahResult.rows[0].total_ayahs;
    }

    res.json({
      success: true,
      page: {
        ...page,
        end_surah_number: endSurah,
        end_ayah_number: endAyah
      }
    });
  } catch (err) {
    console.error('Get page error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Find Page for specific ayah
 * @route GET /api/quran/pages/find/:surah/:ayah
 */
const findPageForAyah = async (req, res) => {
  try {
    const { surah, ayah } = req.params;

    const result = await pool.query(`
      SELECT p.*, s.surah_name_english, s.surah_name_arabic
      FROM pages p
      LEFT JOIN surahs s ON p.surah_number = s.surah_number
      WHERE p.id = (
        SELECT id FROM pages
        WHERE (surah_number < $1) OR (surah_number = $1 AND ayah_number <= $2)
        ORDER BY surah_number DESC, ayah_number DESC
        LIMIT 1
      )
    `, [surah, ayah]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found for this ayah' });
    }

    res.json({
      success: true,
      surah: parseInt(surah),
      ayah: parseInt(ayah),
      page: result.rows[0]
    });
  } catch (err) {
    console.error('Find page error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// =====================================================
// SAJDAS
// =====================================================

/**
 * Get all Sajdas
 * @route GET /api/quran/sajdas
 */
const getAllSajdas = async (req, res) => {
  try {
    const { type } = req.query;

    let query = `
      SELECT
        saj.*,
        s.surah_name_arabic,
        s.surah_name_english,
        qt.text as ayah_text
      FROM sajdas saj
      LEFT JOIN surahs s ON saj.surah_number = s.surah_number
      LEFT JOIN quran_text qt ON saj.surah_number = qt.sura AND saj.ayah_number = qt.aya
    `;

    const params = [];
    if (type && (type === 'recommended' || type === 'obligatory')) {
      query += ` WHERE saj.sajda_type = $1`;
      params.push(type);
    }

    query += ` ORDER BY saj.sajda_number`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      total: result.rows.length,
      sajdas: result.rows
    });
  } catch (err) {
    console.error('Get sajdas error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get specific Sajda by number
 * @route GET /api/quran/sajdas/:number
 */
const getSajdaByNumber = async (req, res) => {
  try {
    const { number } = req.params;

    const result = await pool.query(`
      SELECT
        saj.*,
        s.surah_name_arabic,
        s.surah_name_english,
        qt.text as ayah_text
      FROM sajdas saj
      LEFT JOIN surahs s ON saj.surah_number = s.surah_number
      LEFT JOIN quran_text qt ON saj.surah_number = qt.sura AND saj.ayah_number = qt.aya
      WHERE saj.sajda_number = $1
    `, [number]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sajda not found' });
    }

    res.json({
      success: true,
      sajda: result.rows[0]
    });
  } catch (err) {
    console.error('Get sajda error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get Metadata Statistics
 * @route GET /api/quran/metadata/stats
 */
const getMetadataStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM hizb_quarters) as total_hizb_quarters,
        (SELECT COUNT(DISTINCT hizb_number) FROM hizb_quarters) as total_hizbs,
        (SELECT COUNT(*) FROM manzils) as total_manzils,
        (SELECT COUNT(*) FROM rukus) as total_rukus,
        (SELECT COUNT(*) FROM pages) as total_pages,
        (SELECT COUNT(*) FROM sajdas) as total_sajdas,
        (SELECT COUNT(*) FROM sajdas WHERE sajda_type = 'obligatory') as obligatory_sajdas,
        (SELECT COUNT(*) FROM sajdas WHERE sajda_type = 'recommended') as recommended_sajdas
    `);

    res.json({
      success: true,
      stats: stats.rows[0]
    });
  } catch (err) {
    console.error('Get metadata stats error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

module.exports = {
  // Hizb Quarters
  getAllHizbQuarters,
  getHizbQuarterByNumber,
  findHizbQuarterForAyah,

  // Manzils
  getAllManzils,
  getManzilByNumber,

  // Rukus
  getAllRukus,
  getRukuByNumber,
  findRukuForAyah,

  // Pages
  getAllPages,
  getPageByNumber,
  findPageForAyah,

  // Sajdas
  getAllSajdas,
  getSajdaByNumber,

  // Stats
  getMetadataStats
};
