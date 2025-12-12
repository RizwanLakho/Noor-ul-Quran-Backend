const pool = require('../config/db');
const fs = require('fs');

// Quran structure - same as Python script
const QURAN_STRUCTURE = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
    123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
    34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
    54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
    60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
    14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
    28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
    29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
    15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
    11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
    5, 4, 5, 6
];

// Get all translations (grouped by translator/language)
const getAllTranslations = async (req, res) => {
  try {
    const query = `
      SELECT 
        translator,
        language,
        COUNT(*) as total_ayahs,
        MIN(created_at) as added_date,
        MAX(updated_at) as last_updated
      FROM quran_translation
      GROUP BY translator, language
      ORDER BY MIN(created_at) DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      total: result.rows.length,
      translations: result.rows
    });
  } catch (err) {
    console.error('Get translations error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get translation by translator and language
const getTranslationByName = async (req, res) => {
  try {
    const { translator, language } = req.params;
    const { surah } = req.query;

    let query = 'SELECT * FROM quran_translation WHERE translator = $1 AND language = $2';
    let params = [translator, language];
    
    if (surah) {
      query += ' AND sura = $3';
      params.push(parseInt(surah));
    }
    
    query += ' ORDER BY sura, aya';
    
    const result = await pool.query(query, params);

    res.json({
      success: true,
      translator,
      language,
      total: result.rows.length,
      ayahs: result.rows
    });
  } catch (err) {
    console.error('Get translation error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Check if translation already exists
const checkTranslationExists = async (req, res) => {
  try {
    const { translator, language } = req.query;

    if (!translator || !language) {
      return res.status(400).json({ error: 'Translator and language are required' });
    }

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM quran_translation WHERE translator = $1 AND language = $2',
      [translator, language]
    );

    const exists = parseInt(result.rows[0].count) > 0;

    res.json({
      success: true,
      exists,
      count: parseInt(result.rows[0].count)
    });
  } catch (err) {
    console.error('Check translation error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Upload and parse translation file
const uploadTranslation = async (req, res) => {
  const client = await pool.connect();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { translator_name, language } = req.body;
    const userId = req.user.id;

    if (!translator_name || !language) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Translation name and language are required' });
    }

    // Check if translation already exists
    const existingCheck = await pool.query(
      'SELECT COUNT(*) as count FROM quran_translation WHERE translator = $1 AND language = $2',
      [translator_name, language]
    );

    if (parseInt(existingCheck.rows[0].count) > 0) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        error: `Translation "${translator_name}" in ${language.toUpperCase()} already exists. Please use a different name or delete the existing one first.`,
        exists: true
      });
    }

    console.log('📝 Uploading translation:', { 
      translator: translator_name, 
      language, 
      file: req.file.originalname,
      size: req.file.size 
    });

    // Read file
    const filePath = req.file.path;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log(`📄 File has ${lines.length} lines`);

    const totalExpected = QURAN_STRUCTURE.reduce((sum, count) => sum + count, 0);
    
    if (lines.length !== totalExpected) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: `Invalid file format. Expected ${totalExpected} lines (ayahs), got ${lines.length} lines.`,
        expected: totalExpected,
        received: lines.length
      });
    }

    await client.query('BEGIN');

    let lineIndex = 0;
    let insertedCount = 0;
    const batchSize = 500;
    let batch = [];

    // Map lines to Quran structure
    for (let surahNum = 0; surahNum < QURAN_STRUCTURE.length; surahNum++) {
      const ayahCount = QURAN_STRUCTURE[surahNum];
      
      for (let ayahNum = 1; ayahNum <= ayahCount; ayahNum++) {
        if (lineIndex >= lines.length) break;
        
        const text = lines[lineIndex].replace(/'/g, "''"); // Escape single quotes
        lineIndex++;

        batch.push({
          sura: surahNum + 1,
          aya: ayahNum,
          text,
          translator: translator_name,
          language,
          userId
        });

        // Insert batch when full
        if (batch.length >= batchSize) {
          const values = batch.map((item, idx) => {
            const base = idx * 6;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
          }).join(',');

          const params = batch.flatMap(item => [
            item.sura, item.aya, item.text, item.translator, item.language, item.userId
          ]);

          await client.query(
            `INSERT INTO quran_translation (sura, aya, text, translator, language, added_by) VALUES ${values}`,
            params
          );

          insertedCount += batch.length;
          console.log(`📊 Progress: ${insertedCount}/${totalExpected} ayahs inserted`);
          batch = [];
        }
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const values = batch.map((item, idx) => {
        const base = idx * 6;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
      }).join(',');

      const params = batch.flatMap(item => [
        item.sura, item.aya, item.text, item.translator, item.language, item.userId
      ]);

      await client.query(
        `INSERT INTO quran_translation (sura, aya, text, translator, language, added_by) VALUES ${values}`,
        params
      );

      insertedCount += batch.length;
    }

    // Delete uploaded file
    fs.unlinkSync(filePath);

    await client.query('COMMIT');

    console.log(`✅ Translation uploaded: ${insertedCount} ayahs inserted`);

    res.json({
      success: true,
      message: 'Translation uploaded successfully',
      inserted: insertedCount,
      translator: translator_name,
      language
    });
  } catch (err) {
    await client.query('ROLLBACK');
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('❌ Upload translation error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  } finally {
    client.release();
  }
};

// Delete translation
const deleteTranslation = async (req, res) => {
  try {
    const { translator, language } = req.params;

    const result = await pool.query(
      'DELETE FROM quran_translation WHERE translator = $1 AND language = $2 RETURNING *',
      [translator, language]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    res.json({ 
      success: true, 
      message: 'Translation deleted successfully',
      deleted: result.rows.length
    });
  } catch (err) {
    console.error('Delete translation error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get available languages
const getLanguages = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT language FROM quran_translation ORDER BY language'
    );

    res.json({
      success: true,
      languages: result.rows.map(r => r.language)
    });
  } catch (err) {
    console.error('Get languages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllTranslations,
  getTranslationByName,
  checkTranslationExists,
  uploadTranslation,
  deleteTranslation,
  getLanguages
};
