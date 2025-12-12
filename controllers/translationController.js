const pool = require('../config/db');

// Get ayah with translation(s)
exports.getAyahWithTranslation = async (req, res) => {
  try {
    const { surah, ayah } = req.params;
    const { translator, language } = req.query;

    // Get Arabic text
    const arabicResult = await pool.query(
      'SELECT * FROM quran_text WHERE sura = $1 AND aya = $2',
      [surah, ayah]
    );

    if (arabicResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ayah not found' });
    }

    // Build translation query
    let translationQuery = 'SELECT * FROM quran_translation WHERE sura = $1 AND aya = $2';
    const params = [surah, ayah];

    if (translator) {
      translationQuery += ' AND translator = $3';
      params.push(translator);
    }

    if (language) {
      translationQuery += ` AND language = $${params.length + 1}`;
      params.push(language);
    }

    const translationResult = await pool.query(translationQuery, params);

    res.json({
      success: true,
      arabic: arabicResult.rows[0],
      translations: translationResult.rows
    });
  } catch (err) {
    console.error('Get ayah with translation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get surah with translation
exports.getSurahWithTranslation = async (req, res) => {
  try {
    const { surah } = req.params;
    const { translator } = req.query;

    // Get Arabic text
    const arabicResult = await pool.query(
      'SELECT * FROM quran_text WHERE sura = $1 ORDER BY aya',
      [surah]
    );

    if (arabicResult.rows.length === 0) {
      return res.status(404).json({ error: 'Surah not found' });
    }

    // Get translations
    let translationQuery = 'SELECT * FROM quran_translation WHERE sura = $1 ORDER BY aya';
    const params = [surah];

    if (translator) {
      translationQuery = 'SELECT * FROM quran_translation WHERE sura = $1 AND translator = $2 ORDER BY aya';
      params.push(translator);
    }

    const translationResult = await pool.query(translationQuery, params);

    // Merge Arabic and translations
    const ayahs = arabicResult.rows.map(arabic => {
      const translations = translationResult.rows.filter(
        t => t.aya === arabic.aya
      );
      return {
        ...arabic,
        translations
      };
    });

    res.json({
      success: true,
      surah_number: parseInt(surah),
      total_ayahs: ayahs.length,
      ayahs
    });
  } catch (err) {
    console.error('Get surah with translation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all available translators
exports.getTranslatorsList = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT translator, language, COUNT(*) as total_ayahs 
       FROM quran_translation 
       GROUP BY translator, language 
       ORDER BY language, translator`
    );

    res.json({
      success: true,
      translators: result.rows
    });
  } catch (err) {
    console.error('Get translators error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add new translation (Superuser only)
exports.addTranslation = async (req, res) => {
  try {
    const { sura, aya, text, translator, language } = req.body;
    const userId = req.user.id;

    if (!sura || !aya || !text || !translator) {
      return res.status(400).json({ 
        error: 'Missing required fields: sura, aya, text, translator' 
      });
    }

    // Check if ayah exists
    const ayahCheck = await pool.query(
      'SELECT * FROM quran_text WHERE sura = $1 AND aya = $2',
      [sura, aya]
    );

    if (ayahCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid ayah reference' });
    }

    const result = await pool.query(
      `INSERT INTO quran_translation 
       (sura, aya, text, translator, language, added_by, is_approved) 
       VALUES ($1, $2, $3, $4, $5, $6, false) 
       RETURNING *`,
      [sura, aya, text, translator, language || 'en', userId]
    );

    res.json({
      success: true,
      message: 'Translation added (pending approval)',
      translation: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ 
        error: 'Translation already exists for this ayah and translator' 
      });
    }
    console.error('Add translation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update translation (Superuser only)
exports.updateTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, is_approved } = req.body;

    const result = await pool.query(
      `UPDATE quran_translation 
       SET text = COALESCE($1, text),
           is_approved = COALESCE($2, is_approved),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [text, is_approved, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    res.json({
      success: true,
      translation: result.rows[0]
    });
  } catch (err) {
    console.error('Update translation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete translation (Superuser only)
exports.deleteTranslation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM quran_translation WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    res.json({
      success: true,
      message: 'Translation deleted'
    });
  } catch (err) {
    console.error('Delete translation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = exports;
