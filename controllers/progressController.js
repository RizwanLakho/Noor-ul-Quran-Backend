const pool = require('../config/db');

// ============================================================
// PROGRESS TRACKING ENDPOINTS
// ============================================================

// Start reading a topic (or get existing progress)
exports.startTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if topic exists
    const topicCheck = await pool.query(
      'SELECT * FROM topics WHERE id = $1 AND is_active = true',
      [id]
    );

    if (topicCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Count total items in topic
    const countResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM topic_ayahs WHERE topic_id = $1) as ayah_count,
        (SELECT COUNT(*) FROM topic_hadith WHERE topic_id = $1) as hadith_count`,
      [id]
    );

    const totalItems = parseInt(countResult.rows[0].ayah_count) + parseInt(countResult.rows[0].hadith_count);

    // Check if progress already exists
    const existingProgress = await pool.query(
      'SELECT * FROM user_topic_progress WHERE user_id = $1 AND topic_id = $2',
      [userId, id]
    );

    if (existingProgress.rows.length > 0) {
      // Update last_read_at and view_count
      const updated = await pool.query(
        `UPDATE user_topic_progress 
         SET last_read_at = CURRENT_TIMESTAMP,
             view_count = view_count + 1
         WHERE user_id = $1 AND topic_id = $2
         RETURNING *`,
        [userId, id]
      );

      return res.json({
        success: true,
        progress: updated.rows[0],
        message: 'Continuing topic'
      });
    }

    // Create new progress record
    const result = await pool.query(
      `INSERT INTO user_topic_progress (user_id, topic_id, total_items)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, id, totalItems]
    );

    res.json({
      success: true,
      progress: result.rows[0],
      message: 'Topic started'
    });
  } catch (err) {
    console.error('Start topic error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark ayah as read
exports.markAyahAsRead = async (req, res) => {
  try {
    const { id, ayahId } = req.params;
    const userId = req.user.id;

    // Verify ayah belongs to topic
    const ayahCheck = await pool.query(
      'SELECT * FROM topic_ayahs WHERE id = $1 AND topic_id = $2',
      [ayahId, id]
    );

    if (ayahCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ayah not found in this topic' });
    }

    // Get or create progress
    let progress = await pool.query(
      'SELECT * FROM user_topic_progress WHERE user_id = $1 AND topic_id = $2',
      [userId, id]
    );

    if (progress.rows.length === 0) {
      // Auto-create progress if not exists
      const countResult = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM topic_ayahs WHERE topic_id = $1) as ayah_count,
          (SELECT COUNT(*) FROM topic_hadith WHERE topic_id = $1) as hadith_count`,
        [id]
      );
      const totalItems = parseInt(countResult.rows[0].ayah_count) + parseInt(countResult.rows[0].hadith_count);

      progress = await pool.query(
        `INSERT INTO user_topic_progress (user_id, topic_id, total_items)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, id, totalItems]
      );
    }

    const currentProgress = progress.rows[0];

    // Check if already read
    if (currentProgress.ayahs_read.includes(parseInt(ayahId))) {
      return res.json({
        success: true,
        progress: currentProgress,
        message: 'Ayah already marked as read'
      });
    }

    // Add to ayahs_read array
    const updated = await pool.query(
      `UPDATE user_topic_progress 
       SET ayahs_read = array_append(ayahs_read, $1),
           completed_items = completed_items + 1,
           last_read_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND topic_id = $3
       RETURNING *`,
      [parseInt(ayahId), userId, id]
    );

    res.json({
      success: true,
      progress: updated.rows[0],
      message: `Progress: ${updated.rows[0].progress_percentage}%`
    });
  } catch (err) {
    console.error('Mark ayah as read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark hadith as read
exports.markHadithAsRead = async (req, res) => {
  try {
    const { id, hadithId } = req.params;
    const userId = req.user.id;

    // Verify hadith belongs to topic
    const hadithCheck = await pool.query(
      'SELECT * FROM topic_hadith WHERE id = $1 AND topic_id = $2',
      [hadithId, id]
    );

    if (hadithCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Hadith not found in this topic' });
    }

    // Get progress
    const progress = await pool.query(
      'SELECT * FROM user_topic_progress WHERE user_id = $1 AND topic_id = $2',
      [userId, id]
    );

    if (progress.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not started yet' });
    }

    const currentProgress = progress.rows[0];

    // Check if already read
    if (currentProgress.hadith_read.includes(parseInt(hadithId))) {
      return res.json({
        success: true,
        progress: currentProgress,
        message: 'Hadith already marked as read'
      });
    }

    // Add to hadith_read array
    const updated = await pool.query(
      `UPDATE user_topic_progress 
       SET hadith_read = array_append(hadith_read, $1),
           completed_items = completed_items + 1,
           last_read_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND topic_id = $3
       RETURNING *`,
      [parseInt(hadithId), userId, id]
    );

    res.json({
      success: true,
      progress: updated.rows[0],
      message: `Progress: ${updated.rows[0].progress_percentage}%`
    });
  } catch (err) {
    console.error('Mark hadith as read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user's progress for a topic
exports.getTopicProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM user_topic_progress WHERE user_id = $1 AND topic_id = $2',
      [userId, id]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        progress: null,
        message: 'Topic not started yet'
      });
    }

    res.json({
      success: true,
      progress: result.rows[0]
    });
  } catch (err) {
    console.error('Get topic progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update time spent
exports.updateTimeSpent = async (req, res) => {
  try {
    const { id } = req.params;
    const { seconds } = req.body;
    const userId = req.user.id;

    if (!seconds || seconds < 0) {
      return res.status(400).json({ error: 'Valid seconds value required' });
    }

    const result = await pool.query(
      `UPDATE user_topic_progress 
       SET time_spent_seconds = time_spent_seconds + $1,
           last_read_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND topic_id = $3
       RETURNING *`,
      [seconds, userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    res.json({
      success: true,
      progress: result.rows[0]
    });
  } catch (err) {
    console.error('Update time spent error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all user's progress
exports.getAllUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        up.*,
        t.title,
        t.description,
        t.category,
        t.icon,
        t.color
       FROM user_topic_progress up
       JOIN topics t ON up.topic_id = t.id
       WHERE up.user_id = $1
       ORDER BY up.last_read_at DESC`,
      [userId]
    );

    // Separate into in-progress and completed
    const inProgress = result.rows.filter(p => p.progress_percentage < 100);
    const completed = result.rows.filter(p => p.progress_percentage >= 100);

    res.json({
      success: true,
      in_progress: inProgress,
      completed: completed,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Get all user progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get overall stats
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as topics_started,
        COUNT(*) FILTER (WHERE progress_percentage >= 100) as topics_completed,
        AVG(progress_percentage) as avg_completion,
        SUM(completed_items) as total_items_read,
        SUM(time_spent_seconds) as total_time_seconds,
        COUNT(*) FILTER (WHERE last_read_at::date = CURRENT_DATE) as read_today
       FROM user_topic_progress
       WHERE user_id = $1`,
      [userId]
    );

    // Get streak (consecutive days)
    const streakResult = await pool.query(
      `WITH daily_reads AS (
        SELECT DISTINCT last_read_at::date as read_date
        FROM user_topic_progress
        WHERE user_id = $1
        ORDER BY read_date DESC
      )
      SELECT COUNT(*) as streak
      FROM daily_reads
      WHERE read_date >= CURRENT_DATE - (
        SELECT COUNT(*) FROM daily_reads WHERE read_date >= CURRENT_DATE
      )`,
      [userId]
    );

    // Get bookmarks count
    const bookmarksResult = await pool.query(
      'SELECT COUNT(*) as bookmarks_count FROM user_bookmarks WHERE user_id = $1',
      [userId]
    );

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      stats: {
        topics_started: parseInt(stats.topics_started),
        topics_completed: parseInt(stats.topics_completed),
        overall_completion: parseFloat(stats.avg_completion || 0).toFixed(2),
        total_items_read: parseInt(stats.total_items_read || 0),
        total_time_minutes: Math.floor((stats.total_time_seconds || 0) / 60),
        read_today: parseInt(stats.read_today),
        current_streak_days: parseInt(streakResult.rows[0]?.streak || 0),
        bookmarks_count: parseInt(bookmarksResult.rows[0].bookmarks_count)
      }
    });
  } catch (err) {
    console.error('Get user stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================================
// QURAN READING SESSION TRACKING
// ============================================================

// Record Quran reading session (Surah/Juz reading)
exports.recordReadingSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type, // 'surah' or 'juz' or 'topic'
      surah_number,
      juz_number,
      topic_id,
      ayahs_read, // Number of ayahs read in this session
      time_spent_seconds, // Time spent in seconds
      last_ayah_read, // Last ayah number user read
    } = req.body;

    // Validation
    if (!type || !time_spent_seconds || !ayahs_read) {
      return res.status(400).json({
        success: false,
        error: 'type, ayahs_read, and time_spent_seconds are required'
      });
    }

    if (type === 'surah' && !surah_number) {
      return res.status(400).json({
        success: false,
        error: 'surah_number is required for surah reading'
      });
    }

    if (type === 'juz' && !juz_number) {
      return res.status(400).json({
        success: false,
        error: 'juz_number is required for juz reading'
      });
    }

    // Insert reading session into database
    await pool.query(
      `INSERT INTO reading_sessions
       (user_id, session_type, surah_number, juz_number, topic_id, ayahs_read, time_spent_seconds, last_ayah_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [userId, type, surah_number, juz_number, topic_id, ayahs_read, time_spent_seconds, last_ayah_read]
    );

    // Update user engagement stats
    await pool.query(
      `INSERT INTO user_engagement_stats (user_id, verses_recited, total_time_seconds, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET
         verses_recited = user_engagement_stats.verses_recited + EXCLUDED.verses_recited,
         total_time_seconds = user_engagement_stats.total_time_seconds + EXCLUDED.total_time_seconds,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, ayahs_read, time_spent_seconds]
    );

    res.json({
      success: true,
      message: 'Reading session recorded successfully',
      data: {
        ayahs_read,
        time_spent_seconds
      }
    });
  } catch (err) {
    console.error('Record reading session error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = exports;
