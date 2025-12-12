const pool = require('../config/db');

// ============================================================
// BOOKMARKS ENDPOINTS
// ============================================================

// Add bookmark
exports.addBookmark = async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user.id;

    // Check if topic exists
    const topicCheck = await pool.query(
      'SELECT * FROM topics WHERE id = $1 AND is_active = true',
      [topicId]
    );

    if (topicCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Add bookmark
    const result = await pool.query(
      `INSERT INTO user_bookmarks (user_id, topic_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, topic_id) DO NOTHING
       RETURNING *`,
      [userId, topicId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Topic already bookmarked'
      });
    }

    res.json({
      success: true,
      message: 'Topic bookmarked successfully',
      bookmark: result.rows[0]
    });
  } catch (err) {
    console.error('Add bookmark error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Remove bookmark
exports.removeBookmark = async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM user_bookmarks WHERE user_id = $1 AND topic_id = $2 RETURNING *',
      [userId, topicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (err) {
    console.error('Remove bookmark error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all user bookmarks
exports.getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        ub.id as bookmark_id,
        ub.created_at as bookmarked_at,
        t.*,
        COUNT(DISTINCT ta.id) as ayah_count,
        COUNT(DISTINCT th.id) as hadith_count,
        COALESCE(up.progress_percentage, 0) as progress_percentage
       FROM user_bookmarks ub
       JOIN topics t ON ub.topic_id = t.id
       LEFT JOIN topic_ayahs ta ON t.id = ta.topic_id
       LEFT JOIN topic_hadith th ON t.id = th.topic_id
       LEFT JOIN user_topic_progress up ON t.id = up.topic_id AND up.user_id = ub.user_id
       WHERE ub.user_id = $1 AND t.is_active = true
       GROUP BY ub.id, ub.created_at, t.id, up.progress_percentage
       ORDER BY ub.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      total: result.rows.length,
      bookmarks: result.rows
    });
  } catch (err) {
    console.error('Get bookmarks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = exports;
