const pool = require('../config/db');

// ============================================================
// AYAH BOOKMARKS ENDPOINTS
// ============================================================

// Add ayah bookmark
exports.addAyahBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { surahNumber, ayahNumber, surahName, arabicText, translation } = req.body;

    // Validate required fields
    if (!surahNumber || !ayahNumber) {
      return res.status(400).json({ error: 'Surah number and ayah number are required' });
    }

    // Add bookmark
    const result = await pool.query(
      `INSERT INTO ayah_bookmarks (user_id, surah_number, ayah_number, surah_name, arabic_text, translation)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, surah_number, ayah_number) DO NOTHING
       RETURNING *`,
      [userId, surahNumber, ayahNumber, surahName, arabicText, translation]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Ayah already bookmarked'
      });
    }

    res.json({
      success: true,
      message: 'Ayah bookmarked successfully',
      bookmark: result.rows[0]
    });
  } catch (err) {
    console.error('Add ayah bookmark error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Remove ayah bookmark
exports.removeAyahBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM ayah_bookmarks WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (err) {
    console.error('Remove ayah bookmark error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all user ayah bookmarks
exports.getUserAyahBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
        id,
        surah_number,
        ayah_number,
        surah_name,
        arabic_text,
        translation,
        created_at
       FROM ayah_bookmarks
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      total: result.rows.length,
      bookmarks: result.rows
    });
  } catch (err) {
    console.error('Get ayah bookmarks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Check if ayah is bookmarked
exports.isAyahBookmarked = async (req, res) => {
  try {
    const userId = req.user.id;
    const { surahNumber, ayahNumber } = req.params;

    const result = await pool.query(
      'SELECT id FROM ayah_bookmarks WHERE user_id = $1 AND surah_number = $2 AND ayah_number = $3',
      [userId, surahNumber, ayahNumber]
    );

    res.json({
      success: true,
      isBookmarked: result.rows.length > 0
    });
  } catch (err) {
    console.error('Check ayah bookmark error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = exports;
