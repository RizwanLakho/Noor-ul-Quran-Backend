const pool = require('../config/db');

// ============================================================
// PUBLIC ENDPOINTS (All Users)
// ============================================================

// Get all active quizzes
exports.getAllQuizzes = async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    const userId = req.user ? req.user.id : null;

    let query = `
      SELECT 
        q.*,
        COUNT(DISTINCT qq.id) as question_count,
        CASE 
          WHEN q.time_limit_minutes = 0 THEN 'No time limit'
          ELSE q.time_limit_minutes || ' minutes'
        END as time_limit_display
    `;

    if (userId) {
      query += `,
        COUNT(DISTINCT uqa.id) FILTER (WHERE uqa.user_id = $1 AND uqa.status = 'completed') as user_attempts,
        MAX(uqa.score_percentage) FILTER (WHERE uqa.user_id = $1 AND uqa.status = 'completed') as best_score,
        BOOL_OR(uqa.status = 'completed' AND uqa.user_id = $1) as has_completed
      `;
    }

    query += `
      FROM quizzes q
      LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
    `;

    if (userId) {
      query += `LEFT JOIN user_quiz_attempts uqa ON q.id = uqa.quiz_id `;
    }

    query += `WHERE q.is_active = true `;

    const params = userId ? [userId] : [];
    let paramIndex = params.length + 1;

    if (category) {
      query += ` AND q.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND q.difficulty = $${paramIndex}`;
      params.push(difficulty);
    }

    query += ` GROUP BY q.id ORDER BY q.display_order, q.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      total: result.rows.length,
      quizzes: result.rows
    });
  } catch (err) {
    console.error('Get all quizzes error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get single quiz details (without questions)
exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    const quizResult = await pool.query(
      `SELECT q.*, COUNT(DISTINCT qq.id) as question_count
       FROM quizzes q
       LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
       WHERE q.id = $1 AND q.is_active = true
       GROUP BY q.id`,
      [id]
    );

    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = quizResult.rows[0];

    // Get user's attempts if logged in
    if (userId) {
      const attemptsResult = await pool.query(
        `SELECT
          COUNT(*) as attempt_count,
          MAX(score_percentage) as best_score,
          MAX(completed_at) as last_completed_at,
          BOOL_OR(status = 'completed') as has_completed
         FROM user_quiz_attempts
         WHERE quiz_id = $1 AND user_id = $2 AND status = 'completed'`,
        [id, userId]
      );
      quiz.user_stats = attemptsResult.rows[0];
      quiz.can_attempt = !attemptsResult.rows[0].has_completed; // Can only attempt if not completed
    } else {
      quiz.can_attempt = true; // Guest users can attempt (but need to login)
    }

    res.json({
      success: true,
      quiz: quiz,
      message: quiz.user_stats && quiz.user_stats.has_completed
        ? 'You have already completed this quiz. Each quiz can only be taken once.'
        : undefined
    });
  } catch (err) {
    console.error('Get quiz by ID error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Start quiz - get questions (authenticated users only)
exports.startQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify quiz exists
    const quizCheck = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1 AND is_active = true',
      [id]
    );

    if (quizCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // ⚠️ CHECK: Has user already completed this quiz? (ONE-TIME QUIZ RESTRICTION)
    const completedCheck = await pool.query(
      `SELECT id, score_percentage, passed, completed_at
       FROM user_quiz_attempts
       WHERE user_id = $1 AND quiz_id = $2 AND status = 'completed'
       LIMIT 1`,
      [userId, id]
    );

    if (completedCheck.rows.length > 0) {
      const previousAttempt = completedCheck.rows[0];
      return res.status(403).json({
        success: false,
        error: 'Quiz already completed',
        message: 'You have already completed this quiz. Each quiz can only be taken once.',
        previous_result: {
          attempt_id: previousAttempt.id,
          score_percentage: previousAttempt.score_percentage,
          passed: previousAttempt.passed,
          completed_at: previousAttempt.completed_at
        }
      });
    }

    // Check for any in-progress attempts
    const inProgressCheck = await pool.query(
      `SELECT id FROM user_quiz_attempts
       WHERE user_id = $1 AND quiz_id = $2 AND status = 'in_progress'
       LIMIT 1`,
      [userId, id]
    );

    // If there's an in-progress attempt, delete it and start fresh
    if (inProgressCheck.rows.length > 0) {
      await pool.query(
        'DELETE FROM user_quiz_attempts WHERE id = $1',
        [inProgressCheck.rows[0].id]
      );
    }

    // Get questions (WITHOUT correct_answer)
    const questionsResult = await pool.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, question_order
       FROM quiz_questions
       WHERE quiz_id = $1
       ORDER BY question_order, id`,
      [id]
    );

    if (questionsResult.rows.length === 0) {
      return res.status(400).json({ error: 'Quiz has no questions yet' });
    }

    // Create new attempt
    const attemptResult = await pool.query(
      `INSERT INTO user_quiz_attempts (user_id, quiz_id, total_questions, status)
       VALUES ($1, $2, $3, 'in_progress')
       RETURNING id, started_at`,
      [userId, id, questionsResult.rows.length]
    );

    res.json({
      success: true,
      message: 'Quiz started successfully. Remember: You can only take this quiz once!',
      attempt_id: attemptResult.rows[0].id,
      quiz: quizCheck.rows[0],
      questions: questionsResult.rows,
      started_at: attemptResult.rows[0].started_at
    });
  } catch (err) {
    console.error('Start quiz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Submit quiz answers
exports.submitQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { attempt_id, answers } = req.body;
    const userId = req.user.id;

    if (!attempt_id || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid submission data' });
    }

    // Verify attempt belongs to user
    const attemptCheck = await pool.query(
      'SELECT * FROM user_quiz_attempts WHERE id = $1 AND user_id = $2 AND quiz_id = $3',
      [attempt_id, userId, id]
    );

    if (attemptCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }

    if (attemptCheck.rows[0].status === 'completed') {
      return res.status(400).json({ error: 'Quiz already submitted' });
    }

    // Get correct answers
    const questionsResult = await pool.query(
      'SELECT id, correct_answer FROM quiz_questions WHERE quiz_id = $1',
      [id]
    );

    const correctAnswers = {};
    questionsResult.rows.forEach(q => {
      correctAnswers[q.id] = q.correct_answer;
    });

    // Check answers and save
    let correctCount = 0;
    
    for (const answer of answers) {
      const isCorrect = correctAnswers[answer.question_id] === answer.selected_answer;
      if (isCorrect) correctCount++;

      await pool.query(
        `INSERT INTO user_quiz_answers (attempt_id, question_id, selected_answer, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [attempt_id, answer.question_id, answer.selected_answer, isCorrect]
      );
    }

    // Calculate score
    const totalQuestions = questionsResult.rows.length;
    const scorePercentage = (correctCount / totalQuestions) * 100;

    // Get quiz passing score
    const quizResult = await pool.query(
      'SELECT passing_score FROM quizzes WHERE id = $1',
      [id]
    );
    const passed = scorePercentage >= quizResult.rows[0].passing_score;

    // Calculate time taken
    const timeTaken = Math.floor((Date.now() - new Date(attemptCheck.rows[0].started_at).getTime()) / 1000);

    // Update attempt
    await pool.query(
      `UPDATE user_quiz_attempts
       SET status = 'completed',
           correct_answers = $1,
           score_percentage = $2,
           passed = $3,
           completed_at = CURRENT_TIMESTAMP,
           time_taken_seconds = $4
       WHERE id = $5`,
      [correctCount, scorePercentage, passed, timeTaken, attempt_id]
    );

    res.json({
      success: true,
      result: {
        attempt_id: attempt_id,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        score_percentage: parseFloat(scorePercentage.toFixed(2)),
        passed: passed,
        time_taken_seconds: timeTaken,
        time_taken_minutes: Math.floor(timeTaken / 60),
        can_review: true
      }
    });
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get user's quiz attempts
exports.getMyAttempts = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        uqa.*,
        q.name as quiz_name,
        q.category,
        q.difficulty
       FROM user_quiz_attempts uqa
       JOIN quizzes q ON uqa.quiz_id = q.id
       WHERE uqa.user_id = $1 AND uqa.status = 'completed'
       ORDER BY uqa.completed_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      total: result.rows.length,
      attempts: result.rows
    });
  } catch (err) {
    console.error('Get my attempts error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get single attempt result
exports.getAttemptResult = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        uqa.*,
        q.name as quiz_name,
        q.category,
        q.difficulty
       FROM user_quiz_attempts uqa
       JOIN quizzes q ON uqa.quiz_id = q.id
       WHERE uqa.id = $1 AND uqa.user_id = $2`,
      [attemptId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    res.json({
      success: true,
      attempt: result.rows[0]
    });
  } catch (err) {
    console.error('Get attempt result error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Review quiz answers (READ-ONLY)
exports.reviewQuiz = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // Verify attempt belongs to user and is completed
    const attemptResult = await pool.query(
      `SELECT uqa.*, q.name as quiz_name
       FROM user_quiz_attempts uqa
       JOIN quizzes q ON uqa.quiz_id = q.id
       WHERE uqa.id = $1 AND uqa.user_id = $2 AND uqa.status = 'completed'`,
      [attemptId, userId]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Completed attempt not found' });
    }

    const attempt = attemptResult.rows[0];

    if (!attempt.can_review) {
      return res.status(403).json({ error: 'Review not allowed for this quiz' });
    }

    // Get questions with user's answers
    const reviewResult = await pool.query(
      `SELECT 
        qq.id,
        qq.question_text,
        qq.question_order,
        qq.option_a,
        qq.option_b,
        qq.option_c,
        qq.option_d,
        qq.correct_answer,
        uqans.selected_answer as user_answer,
        uqans.is_correct
       FROM quiz_questions qq
       JOIN user_quiz_answers uqans ON qq.id = uqans.question_id
       WHERE uqans.attempt_id = $1
       ORDER BY qq.question_order, qq.id`,
      [attemptId]
    );

    res.json({
      success: true,
      quiz_name: attempt.quiz_name,
      attempt_summary: {
        score: `${attempt.correct_answers}/${attempt.total_questions}`,
        score_percentage: attempt.score_percentage,
        passed: attempt.passed,
        completed_at: attempt.completed_at,
        time_taken_minutes: Math.floor(attempt.time_taken_seconds / 60)
      },
      questions_with_answers: reviewResult.rows
    });
  } catch (err) {
    console.error('Review quiz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get quiz categories
exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT category, COUNT(*) as quiz_count
       FROM quizzes
       WHERE is_active = true AND category IS NOT NULL
       GROUP BY category
       ORDER BY category`
    );

    res.json({
      success: true,
      categories: result.rows
    });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

module.exports = exports;
