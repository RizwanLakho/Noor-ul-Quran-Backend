const pool = require('../config/db');

const getAllJuz = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        juz_number,
        juz_name_arabic,
        juz_name_english,
        starting_surah,
        starting_ayah,
        ending_surah,
        ending_ayah
      FROM juz
      ORDER BY juz_number
    `);

    res.json({
      success: true,
      total: result.rows.length,
      juz: result.rows
    });
  } catch (err) {
    console.error('Get all juz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const getJuzById = async (req, res) => {
  try {
    const { juzNumber } = req.params;

    const juzResult = await pool.query(
      'SELECT * FROM juz WHERE juz_number = $1',
      [juzNumber]
    );

    if (juzResult.rows.length === 0) {
      return res.status(404).json({ error: 'Juz not found' });
    }

    const juz = juzResult.rows[0];

    const ayahsResult = await pool.query(`
      SELECT 
        q.sura,
        q.aya,
        q.text,
        s.surah_name_english,
        s.surah_name_arabic
      FROM quran_text q
      JOIN surahs s ON q.sura = s.surah_number
      WHERE 
        (q.sura > $1 OR (q.sura = $1 AND q.aya >= $2))
        AND (q.sura < $3 OR (q.sura = $3 AND q.aya <= $4))
      ORDER BY q.sura, q.aya
    `, [juz.starting_surah, juz.starting_ayah, juz.ending_surah, juz.ending_ayah]);

    res.json({
      success: true,
      juz: juz,
      total_ayahs: ayahsResult.rows.length,
      ayahs: ayahsResult.rows
    });
  } catch (err) {
    console.error('Get juz by id error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const getJuzWithTranslation = async (req, res) => {
  try {
    const { juzNumber } = req.params;
    const { translator, language } = req.query;

    const juzResult = await pool.query(
      'SELECT * FROM juz WHERE juz_number = $1',
      [juzNumber]
    );

    if (juzResult.rows.length === 0) {
      return res.status(404).json({ error: 'Juz not found' });
    }

    const juz = juzResult.rows[0];

    // FIXED: Use single JOIN to avoid duplicates
    const query = `
      SELECT 
        q.sura,
        q.aya,
        q.text as arabic_text,
        s.surah_name_english,
        s.surah_name_arabic,
        qt.text as translation
      FROM quran_text q
      JOIN surahs s ON q.sura = s.surah_number
      LEFT JOIN quran_translation qt ON 
        q.sura = qt.sura 
        AND q.aya = qt.aya 
        AND qt.translator = $5 
        AND qt.language = $6
      WHERE 
        (q.sura > $1 OR (q.sura = $1 AND q.aya >= $2))
        AND (q.sura < $3 OR (q.sura = $3 AND q.aya <= $4))
      ORDER BY q.sura, q.aya
    `;

    const params = [
      juz.starting_surah, 
      juz.starting_ayah, 
      juz.ending_surah, 
      juz.ending_ayah,
      translator || '', 
      language || ''
    ];

    const ayahsResult = await pool.query(query, params);

    res.json({
      success: true,
      juz: juz,
      translator: translator || null,
      language: language || null,
      total_ayahs: ayahsResult.rows.length,
      ayahs: ayahsResult.rows
    });
  } catch (err) {
    console.error('Get juz with translation error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const findJuzForAyah = async (req, res) => {
  try {
    const { surah, ayah } = req.params;

    const result = await pool.query(`
      SELECT * FROM juz
      WHERE 
        (starting_surah < $1 OR (starting_surah = $1 AND starting_ayah <= $2))
        AND (ending_surah > $1 OR (ending_surah = $1 AND ending_ayah >= $2))
    `, [surah, ayah]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Juz not found for this ayah' });
    }

    res.json({
      success: true,
      surah: parseInt(surah),
      ayah: parseInt(ayah),
      juz: result.rows[0]
    });
  } catch (err) {
    console.error('Find juz for ayah error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

module.exports = {
  getAllJuz,
  getJuzById,
  getJuzWithTranslation,
  findJuzForAyah
};
