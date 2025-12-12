const pool = require('../config/db');

// ============================================================
// ADMIN ENDPOINTS (Superuser Only)
// ============================================================

// Create new quiz
exports.createQuiz = async (req, res) => {
  try {
    const { name, description, category, difficulty, time_limit_minutes, passing_score, display_order } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Quiz name is required' });
    }

    const result = await pool.query(
      `INSERT INTO quizzes (name, description, category, difficulty, time_limit_minutes, passing_score, display_order, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, category, difficulty || 'medium', time_limit_minutes || 0, passing_score || 60, display_order || 0, userId]
    );

    res.json({
      success: true,
      message: 'Quiz created successfully',
      quiz: result.rows[0]
    });
  } catch (err) {
    console.error('Create quiz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Update quiz
exports.updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, difficulty, time_limit_minutes, passing_score, display_order, is_active } = req.body;

    const result = await pool.query(
      `UPDATE quizzes
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           difficulty = COALESCE($4, difficulty),
           time_limit_minutes = COALESCE($5, time_limit_minutes),
           passing_score = COALESCE($6, passing_score),
           display_order = COALESCE($7, display_order),
           is_active = COALESCE($8, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name, description, category, difficulty, time_limit_minutes, passing_score, display_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      quiz: result.rows[0]
    });
  } catch (err) {
    console.error('Update quiz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Delete quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM quizzes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (err) {
    console.error('Delete quiz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Add question to quiz
exports.addQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_answer, question_order, points } = req.body;

    // Validation
    if (!question_text || !option_a || !option_b || !correct_answer) {
      return res.status(400).json({ error: 'Question text, options A & B, and correct answer are required' });
    }

    if (!['A', 'B', 'C', 'D'].includes(correct_answer.toUpperCase())) {
      return res.status(400).json({ error: 'Correct answer must be A, B, C, or D' });
    }

    // Verify quiz exists
    const quizCheck = await pool.query('SELECT id FROM quizzes WHERE id = $1', [id]);
    if (quizCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const result = await pool.query(
      `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_order, points)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, question_text, option_a, option_b, option_c, option_d, correct_answer.toUpperCase(), question_order || 0, points || 1]
    );

    res.json({
      success: true,
      message: 'Question added successfully',
      question: result.rows[0]
    });
  } catch (err) {
    console.error('Add question error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Update question
exports.updateQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_answer, question_order, points } = req.body;

    // Validate correct_answer if provided
    if (correct_answer && !['A', 'B', 'C', 'D'].includes(correct_answer.toUpperCase())) {
      return res.status(400).json({ error: 'Correct answer must be A, B, C, or D' });
    }

    const result = await pool.query(
      `UPDATE quiz_questions
       SET question_text = COALESCE($1, question_text),
           option_a = COALESCE($2, option_a),
           option_b = COALESCE($3, option_b),
           option_c = COALESCE($4, option_c),
           option_d = COALESCE($5, option_d),
           correct_answer = COALESCE($6, correct_answer),
           question_order = COALESCE($7, question_order),
           points = COALESCE($8, points)
       WHERE id = $9 AND quiz_id = $10
       RETURNING *`,
      [question_text, option_a, option_b, option_c, option_d, correct_answer ? correct_answer.toUpperCase() : null, question_order, points, questionId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Question updated successfully',
      question: result.rows[0]
    });
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;

    const result = await pool.query(
      'DELETE FROM quiz_questions WHERE id = $1 AND quiz_id = $2 RETURNING *',
      [questionId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (err) {
    console.error('Delete question error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get all questions in quiz (with correct answers - admin only)
exports.getQuizQuestions = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM quiz_questions
       WHERE quiz_id = $1
       ORDER BY question_order, id`,
      [id]
    );

    res.json({
      success: true,
      total: result.rows.length,
      questions: result.rows
    });
  } catch (err) {
    console.error('Get quiz questions error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get quiz analytics
exports.getQuizAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    // Quiz details
    const quizResult = await pool.query('SELECT * FROM quizzes WHERE id = $1', [id]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Statistics
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_attempts,
        COUNT(*) FILTER (WHERE passed = true) as passed_count,
        AVG(score_percentage) FILTER (WHERE status = 'completed') as avg_score,
        MAX(score_percentage) as highest_score,
        MIN(score_percentage) FILTER (WHERE status = 'completed') as lowest_score,
        AVG(time_taken_seconds) FILTER (WHERE status = 'completed') as avg_time_seconds
       FROM user_quiz_attempts
       WHERE quiz_id = $1`,
      [id]
    );

    // Recent attempts
    const recentResult = await pool.query(
      `SELECT 
        uqa.id,
        uqa.score_percentage,
        uqa.passed,
        uqa.completed_at,
        u.username,
        u.email
       FROM user_quiz_attempts uqa
       JOIN users u ON uqa.user_id = u.id
       WHERE uqa.quiz_id = $1 AND uqa.status = 'completed'
       ORDER BY uqa.completed_at DESC
       LIMIT 10`,
      [id]
    );

    const stats = statsResult.rows[0];
    const passRate = stats.completed_attempts > 0 
      ? ((stats.passed_count / stats.completed_attempts) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      quiz: quizResult.rows[0],
      analytics: {
        total_attempts: parseInt(stats.total_attempts),
        completed_attempts: parseInt(stats.completed_attempts),
        passed_count: parseInt(stats.passed_count),
        pass_rate: parseFloat(passRate),
        avg_score: parseFloat(stats.avg_score || 0).toFixed(2),
        highest_score: parseFloat(stats.highest_score || 0).toFixed(2),
        lowest_score: parseFloat(stats.lowest_score || 0).toFixed(2),
        avg_time_minutes: Math.floor((stats.avg_time_seconds || 0) / 60)
      },
      recent_attempts: recentResult.rows
    });
  } catch (err) {
    console.error('Get quiz analytics error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get all user attempts for a quiz
exports.getQuizAttempts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT 
        uqa.*,
        u.username,
        u.email
       FROM user_quiz_attempts uqa
       JOIN users u ON uqa.user_id = u.id
       WHERE uqa.quiz_id = $1 AND uqa.status = 'completed'
       ORDER BY uqa.completed_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM user_quiz_attempts WHERE quiz_id = $1 AND status = \'completed\'',
      [id]
    );

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].count),
      attempts: result.rows
    });
  } catch (err) {
    console.error('Get quiz attempts error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// View user's specific attempt with answers (admin only)
exports.viewUserAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    // Get attempt details
    const attemptResult = await pool.query(
      `SELECT 
        uqa.*,
        u.username,
        u.email,
        q.name as quiz_name
       FROM user_quiz_attempts uqa
       JOIN users u ON uqa.user_id = u.id
       JOIN quizzes q ON uqa.quiz_id = q.id
       WHERE uqa.id = $1`,
      [attemptId]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Get answers
    const answersResult = await pool.query(
      `SELECT 
        qq.question_text,
        qq.option_a,
        qq.option_b,
        qq.option_c,
        qq.option_d,
        qq.correct_answer,
        uqans.selected_answer,
        uqans.is_correct
       FROM user_quiz_answers uqans
       JOIN quiz_questions qq ON uqans.question_id = qq.id
       WHERE uqans.attempt_id = $1
       ORDER BY qq.question_order`,
      [attemptId]
    );

    res.json({
      success: true,
      attempt: attemptResult.rows[0],
      answers: answersResult.rows
    });
  } catch (err) {
    console.error('View user attempt error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

module.exports = exports;
