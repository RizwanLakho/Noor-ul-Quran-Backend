const pool = require('../config/db');

/**
 * Get user's progress for a specific topic
 * GET /api/topics/:topicId/progress
 */
const getTopicProgress = async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const query = `
      SELECT
        id,
        user_id,
        topic_id,
        progress_percentage,
        completed_items,
        total_items,
        ayahs_read,
        hadith_read,
        view_count,
        time_spent_seconds,
        started_at,
        last_read_at,
        completed_at
      FROM user_topic_progress
      WHERE user_id = $1 AND topic_id = $2
    `;

    const result = await pool.query(query, [userId, topicId]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        progress: null,
        message: 'No progress found for this topic',
      });
    }

    res.json({
      success: true,
      progress: result.rows[0],
    });
  } catch (error) {
    console.error('Error getting topic progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get topic progress',
      error: error.message,
    });
  }
};

/**
 * Save or update user's progress for a topic
 * POST /api/topics/:topicId/progress
 * Body: { progressPercentage, completedItems, totalItems, ayahsRead, hadithRead, timeSpent }
 */
const saveTopicProgress = async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user?.id;
    const {
      progressPercentage = 0,
      completedItems = 0,
      totalItems = 0,
      ayahsRead = [],
      hadithRead = [],
      timeSpent = 0,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Calculate if topic is completed (90% or more)
    const isCompleted = progressPercentage >= 90;
    const completedAt = isCompleted ? new Date() : null;

    // Upsert progress
    const query = `
      INSERT INTO user_topic_progress (
        user_id,
        topic_id,
        progress_percentage,
        completed_items,
        total_items,
        ayahs_read,
        hadith_read,
        time_spent_seconds,
        last_read_at,
        completed_at,
        view_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9, 1)
      ON CONFLICT (user_id, topic_id)
      DO UPDATE SET
        progress_percentage = GREATEST(user_topic_progress.progress_percentage, EXCLUDED.progress_percentage),
        completed_items = EXCLUDED.completed_items,
        total_items = EXCLUDED.total_items,
        ayahs_read = EXCLUDED.ayahs_read,
        hadith_read = EXCLUDED.hadith_read,
        time_spent_seconds = user_topic_progress.time_spent_seconds + EXCLUDED.time_spent_seconds,
        last_read_at = CURRENT_TIMESTAMP,
        completed_at = CASE
          WHEN EXCLUDED.completed_at IS NOT NULL THEN EXCLUDED.completed_at
          ELSE user_topic_progress.completed_at
        END,
        view_count = user_topic_progress.view_count + 1
      RETURNING *
    `;

    const values = [
      userId,
      topicId,
      progressPercentage,
      completedItems,
      totalItems,
      ayahsRead,
      hadithRead,
      timeSpent,
      completedAt,
    ];

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: 'Progress saved successfully',
      progress: result.rows[0],
    });
  } catch (error) {
    console.error('Error saving topic progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save topic progress',
      error: error.message,
    });
  }
};

/**
 * Get all topics progress for current user
 * GET /api/topics/progress/all
 */
const getAllTopicsProgress = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const query = `
      SELECT
        utp.*,
        t.title as topic_title,
        t.category as topic_category,
        t.icon as topic_icon
      FROM user_topic_progress utp
      JOIN topics t ON utp.topic_id = t.id
      WHERE utp.user_id = $1
      ORDER BY utp.last_read_at DESC
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      progress: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error getting all topics progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get topics progress',
      error: error.message,
    });
  }
};

/**
 * Mark ayah as read
 * POST /api/topics/:topicId/ayah-read
 * Body: { ayahId }
 */
const markAyahAsRead = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { ayahId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Get current progress or create new
    const selectQuery = `
      SELECT ayahs_read, hadith_read, total_items
      FROM user_topic_progress
      WHERE user_id = $1 AND topic_id = $2
    `;

    let result = await pool.query(selectQuery, [userId, topicId]);
    let ayahsRead = [];
    let hadithRead = [];
    let totalItems = 0;

    if (result.rows.length > 0) {
      ayahsRead = result.rows[0].ayahs_read || [];
      hadithRead = result.rows[0].hadith_read || [];
      totalItems = result.rows[0].total_items;
    }

    // Add ayah to read list if not already there
    if (!ayahsRead.includes(ayahId)) {
      ayahsRead.push(ayahId);
    }

    // Calculate progress
    const completedItems = ayahsRead.length + hadithRead.length;
    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Update progress
    const updateQuery = `
      INSERT INTO user_topic_progress (
        user_id, topic_id, ayahs_read, hadith_read,
        completed_items, progress_percentage, total_items, last_read_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, topic_id)
      DO UPDATE SET
        ayahs_read = EXCLUDED.ayahs_read,
        completed_items = EXCLUDED.completed_items,
        progress_percentage = EXCLUDED.progress_percentage,
        last_read_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    result = await pool.query(updateQuery, [
      userId,
      topicId,
      ayahsRead,
      hadithRead,
      completedItems,
      progressPercentage,
      totalItems,
    ]);

    res.json({
      success: true,
      message: 'Ayah marked as read',
      progress: result.rows[0],
    });
  } catch (error) {
    console.error('Error marking ayah as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark ayah as read',
      error: error.message,
    });
  }
};

/**
 * Delete topic progress (reset)
 * DELETE /api/topics/:topicId/progress
 */
const deleteTopicProgress = async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const query = `
      DELETE FROM user_topic_progress
      WHERE user_id = $1 AND topic_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [userId, topicId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found',
      });
    }

    res.json({
      success: true,
      message: 'Topic progress deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting topic progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete topic progress',
      error: error.message,
    });
  }
};

module.exports = {
  getTopicProgress,
  saveTopicProgress,
  getAllTopicsProgress,
  markAyahAsRead,
  deleteTopicProgress,
};
