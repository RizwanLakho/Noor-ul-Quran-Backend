const pool = require('../config/db');

const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        r.role_name as role,
        u.created_at,
        COUNT(DISTINCT uqa.id) as total_quiz_attempts,
        COUNT(DISTINCT CASE WHEN uqa.passed = true THEN uqa.id END) as passed_quizzes,
        COALESCE(AVG(CASE WHEN uqa.status = 'completed' THEN uqa.score_percentage END), 0) as avg_quiz_score,
        COUNT(DISTINCT utp.id) as topics_in_progress,
        COUNT(DISTINCT uab.id) as total_bookmarks
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_quiz_attempts uqa ON u.id = uqa.user_id
      LEFT JOIN user_topic_progress utp ON u.id = utp.user_id
      LEFT JOIN user_bookmarks uab ON u.id = uab.user_id
      WHERE u.role_id != 1
      GROUP BY u.id, u.first_name, u.last_name, u.email, r.role_name, u.created_at
      ORDER BY u.created_at DESC
    `;
    const result = await pool.query(query);
    res.json({ success: true, total: result.rows.length, users: result.rows });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const userResult = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, r.role_name as role, u.created_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    const quizAttemptsResult = await pool.query(
      `SELECT uqa.*, q.title as quiz_name, q.difficulty, q.category, q.passing_score
       FROM user_quiz_attempts uqa LEFT JOIN quizzes q ON uqa.quiz_id = q.id
       WHERE uqa.user_id = $1 ORDER BY uqa.started_at DESC`,
      [userId]
    );

    const topicProgressResult = await pool.query(
      `SELECT utp.*, t.title as topic_title, t.category
       FROM user_topic_progress utp LEFT JOIN topics t ON utp.topic_id = t.id
       WHERE utp.user_id = $1 ORDER BY utp.last_read_at DESC`,
      [userId]
    );

    const bookmarksResult = await pool.query(
      `SELECT ub.id, ub.topic_id, ub.created_at,
              t.title as topic_title, t.category
       FROM user_bookmarks ub
       LEFT JOIN topics t ON ub.topic_id = t.id
       WHERE ub.user_id = $1 ORDER BY ub.created_at DESC`,
      [userId]
    );

    const quizAttempts = quizAttemptsResult.rows;
    const completedQuizzes = quizAttempts.filter(q => q.status === 'completed').length;
    const passedQuizzes = quizAttempts.filter(q => q.passed === true).length;
    const avgScore = completedQuizzes > 0 
      ? quizAttempts.filter(q => q.status === 'completed')
          .reduce((sum, q) => sum + parseFloat(q.score_percentage || 0), 0) / completedQuizzes : 0;

    res.json({
      success: true,
      user,
      statistics: {
        total_quiz_attempts: quizAttempts.length,
        completed_quizzes: completedQuizzes,
        passed_quizzes: passedQuizzes,
        avg_quiz_score: Math.round(avgScore * 100) / 100,
        topics_started: topicProgressResult.rows.length,
        total_bookmarks: bookmarksResult.rows.length
      },
      quiz_attempts: quizAttempts,
      topic_progress: topicProgressResult.rows,
      bookmarks: bookmarksResult.rows
    });
  } catch (err) {
    console.error('Get user analytics error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const getUserQuizPerformance = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT uqa.*, q.title as quiz_name, q.difficulty, q.category, q.passing_score
       FROM user_quiz_attempts uqa LEFT JOIN quizzes q ON uqa.quiz_id = q.id
       WHERE uqa.user_id = $1 ORDER BY uqa.started_at DESC`,
      [userId]
    );
    res.json({ success: true, total: result.rows.length, attempts: result.rows });
  } catch (err) {
    console.error('Get quiz performance error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const getUserTopicProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT utp.*, t.title as topic_title, t.description, t.category
       FROM user_topic_progress utp LEFT JOIN topics t ON utp.topic_id = t.id
       WHERE utp.user_id = $1 ORDER BY utp.last_read_at DESC`,
      [userId]
    );
    res.json({ success: true, total: result.rows.length, progress: result.rows });
  } catch (err) {
    console.error('Get topic progress error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const getPlatformStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role_id != 1) as total_users,
        (SELECT COUNT(*) FROM user_quiz_attempts) as total_quiz_attempts,
        (SELECT COUNT(*) FROM user_quiz_attempts WHERE status = 'completed') as completed_quizzes,
        (SELECT COALESCE(AVG(score_percentage), 0) FROM user_quiz_attempts WHERE status = 'completed') as avg_quiz_score,
        (SELECT COUNT(DISTINCT user_id) FROM user_topic_progress) as active_learners,
        (SELECT COUNT(*) FROM user_bookmarks) as total_bookmarks,
        (SELECT COUNT(*) FROM topics) as total_topics,
        (SELECT COUNT(*) FROM quizzes) as total_quizzes
    `);
    res.json({ success: true, stats: stats.rows[0] });
  } catch (err) {
    console.error('Get platform stats error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserAnalytics,
  getUserQuizPerformance,
  getUserTopicProgress,
  getPlatformStats
};
