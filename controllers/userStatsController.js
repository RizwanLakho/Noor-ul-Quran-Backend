const pool = require('../config/db');

/**
 * Get user statistics dashboard
 * GET /api/users/me/stats
 */
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get topic progress stats
    const topicStats = await pool.query(
      `SELECT
        COUNT(DISTINCT topic_id) as topics_started,
        COUNT(DISTINCT CASE WHEN progress_percentage = 100 THEN topic_id END) as topics_completed,
        COALESCE(AVG(progress_percentage), 0) as avg_completion,
        COALESCE(SUM(time_spent_seconds), 0) as total_time_seconds
      FROM user_topic_progress
      WHERE user_id = $1`,
      [userId]
    );

    // Get quiz stats
    const quizStats = await pool.query(
      `SELECT
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN passed = true THEN 1 END) as passed_attempts,
        COALESCE(AVG(score_percentage), 0) as avg_score,
        MAX(completed_at) as last_quiz_date
      FROM user_quiz_attempts
      WHERE user_id = $1`,
      [userId]
    );

    // Get verses recited (from topic progress - count ayahs from completed topics)
    const versesRecited = await pool.query(
      `SELECT COUNT(DISTINCT CONCAT(ta.sura, '-', ta.aya)) as verses_count
      FROM user_topic_progress utp
      JOIN topic_ayahs ta ON utp.topic_id = ta.topic_id
      WHERE utp.user_id = $1 AND utp.progress_percentage > 0`,
      [userId]
    );

    // Get bookmarks count
    const bookmarks = await pool.query(
      `SELECT COUNT(*) as bookmarks_count
      FROM user_ayah_bookmarks
      WHERE user_id = $1`,
      [userId]
    );

    // Get current streak (days of consecutive activity)
    const streakQuery = await pool.query(
      `WITH RECURSIVE dates AS (
        SELECT CURRENT_DATE as date
        UNION ALL
        SELECT (date - INTERVAL '1 day')::date
        FROM dates
        WHERE date > CURRENT_DATE - INTERVAL '30 days'
      ),
      user_activity_dates AS (
        SELECT DISTINCT DATE(last_read_at) as activity_date
        FROM user_topic_progress
        WHERE user_id = $1 AND last_read_at >= CURRENT_DATE - INTERVAL '30 days'
        UNION
        SELECT DISTINCT DATE(completed_at)
        FROM user_quiz_attempts
        WHERE user_id = $1 AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
      ),
      streak_check AS (
        SELECT
          d.date,
          CASE WHEN uad.activity_date IS NOT NULL THEN 1 ELSE 0 END as has_activity,
          ROW_NUMBER() OVER (ORDER BY d.date DESC) as day_num
        FROM dates d
        LEFT JOIN user_activity_dates uad ON d.date = uad.activity_date
        ORDER BY d.date DESC
      )
      SELECT COUNT(*) as current_streak
      FROM streak_check
      WHERE day_num <= (
        SELECT COALESCE(MIN(day_num), 0)
        FROM streak_check
        WHERE has_activity = 0
      ) AND has_activity = 1`,
      [userId]
    );

    const stats = {
      topics: {
        started: parseInt(topicStats.rows[0].topics_started) || 0,
        completed: parseInt(topicStats.rows[0].topics_completed) || 0,
        avgCompletion: parseFloat(topicStats.rows[0].avg_completion).toFixed(1) || 0,
      },
      quizzes: {
        totalAttempts: parseInt(quizStats.rows[0].total_attempts) || 0,
        passed: parseInt(quizStats.rows[0].passed_attempts) || 0,
        avgScore: parseFloat(quizStats.rows[0].avg_score).toFixed(1) || 0,
        lastQuizDate: quizStats.rows[0].last_quiz_date,
      },
      engagement: {
        totalTimeSeconds: parseInt(topicStats.rows[0].total_time_seconds) || 0,
        versesRecited: parseInt(versesRecited.rows[0].verses_count) || 0,
        bookmarksCount: parseInt(bookmarks.rows[0].bookmarks_count) || 0,
        currentStreak: parseInt(streakQuery.rows[0].current_streak) || 0,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message,
    });
  }
};

/**
 * Get user recent activity
 * GET /api/users/me/activity
 */
const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent topic reading activity
    const topicActivity = await pool.query(
      `SELECT
        'topic_read' as activity_type,
        t.id,
        t.title,
        utp.progress_percentage,
        utp.last_read_at as timestamp
      FROM user_topic_progress utp
      JOIN topics t ON utp.topic_id = t.id
      WHERE utp.user_id = $1
      ORDER BY utp.last_read_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    // Get recent quiz attempts
    const quizActivity = await pool.query(
      `SELECT
        'quiz_completed' as activity_type,
        q.id,
        q.title,
        uqa.score_percentage,
        uqa.passed,
        uqa.completed_at as timestamp
      FROM user_quiz_attempts uqa
      JOIN quizzes q ON uqa.quiz_id = q.id
      WHERE uqa.user_id = $1 AND uqa.status = 'completed'
      ORDER BY uqa.completed_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    // Combine and sort by timestamp
    const activities = [
      ...topicActivity.rows.map((a) => ({
        type: a.activity_type,
        id: a.id,
        title: a.title,
        details: {
          progress: a.progress_percentage,
        },
        timestamp: a.timestamp,
      })),
      ...quizActivity.rows.map((a) => ({
        type: a.activity_type,
        id: a.id,
        title: a.title,
        details: {
          score: a.score_percentage,
          passed: a.passed,
        },
        timestamp: a.timestamp,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('❌ Error getting user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message,
    });
  }
};

module.exports = {
  getUserStats,
  getUserActivity,
};
