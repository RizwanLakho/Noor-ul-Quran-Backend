const pool = require('../config/db');

/**
 * Start a quiz attempt
 * POST /api/quizzes/:id/start
 */
const startQuizAttempt = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const userId = req.user?.id || null; // Get user ID from auth token if available

    console.log('📝 Starting quiz attempt:', { quizId, userId });

    // Check if quiz exists
    const quizCheck = await pool.query(
      'SELECT id, title, time_limit FROM quizzes WHERE id = $1 AND is_active = true',
      [quizId]
    );

    if (quizCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found or not active' });
    }

    const quiz = quizCheck.rows[0];

    // Get question count for this quiz
    const questionCount = await pool.query(
      'SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_id = $1',
      [quizId]
    );

    const totalQuestions = parseInt(questionCount.rows[0].count);

    // Create quiz attempt record (if user is authenticated)
    let attemptId = null;

    if (userId) {
      const attemptResult = await pool.query(
        `INSERT INTO user_quiz_attempts
        (user_id, quiz_id, total_questions, status)
        VALUES ($1, $2, $3, 'in_progress')
        RETURNING id`,
        [userId, quizId, totalQuestions]
      );
      attemptId = attemptResult.rows[0].id;
      console.log('✅ Quiz attempt created with ID:', attemptId);
    } else {
      console.log('⚠️ Guest user - no attempt record created');
    }

    res.json({
      success: true,
      message: 'Quiz attempt started',
      attemptId: attemptId,
      quizId: parseInt(quizId),
      quizTitle: quiz.title,
      timeLimit: quiz.time_limit,
      totalQuestions: totalQuestions
    });
  } catch (err) {
    console.error('❌ Start quiz attempt error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Submit quiz and calculate results
 * POST /api/quizzes/:id/submit
 * Body: { attemptId, answers: [{ questionId, selectedAnswer }] }
 */
const submitQuizAttempt = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id: quizId } = req.params;
    const { attemptId, answers } = req.body;
    const userId = req.user?.id || null;

    console.log('📤 Submitting quiz:', { quizId, attemptId, answersCount: answers?.length, userId });

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    // Get quiz details
    const quizResult = await client.query(
      'SELECT id, title, passing_score FROM quizzes WHERE id = $1',
      [quizId]
    );

    if (quizResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = quizResult.rows[0];

    // Get all questions for this quiz
    const questionsResult = await client.query(
      'SELECT id, correct_answer FROM quiz_questions WHERE quiz_id = $1',
      [quizId]
    );

    const questions = questionsResult.rows;
    const totalQuestions = questions.length;

    // Calculate results
    let correctAnswers = 0;
    const answerDetails = [];

    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);

      if (question) {
        // Trim whitespace from both answers for comparison
        const userAnswer = (answer.selectedAnswer || '').trim().toUpperCase();
        const correctAnswer = (question.correct_answer || '').trim().toUpperCase();
        const isCorrect = userAnswer === correctAnswer;

        if (isCorrect) {
          correctAnswers++;
        }

        answerDetails.push({
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: question.correct_answer,
          isCorrect: isCorrect
        });

        // Save individual answer if attemptId is provided
        if (attemptId && userId) {
          await client.query(
            `INSERT INTO user_quiz_answers (attempt_id, question_id, selected_answer, is_correct)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (attempt_id, question_id)
             DO UPDATE SET selected_answer = $3, is_correct = $4`,
            [attemptId, answer.questionId, answer.selectedAnswer, isCorrect]
          );
        }
      }
    }

    const score = correctAnswers * 10; // 10 points per correct answer
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = percentage >= (quiz.passing_score || 70);

    console.log(`📊 Results: ${correctAnswers}/${totalQuestions} correct (${percentage}%) - ${passed ? 'PASSED' : 'FAILED'}`);

    // Update attempt record if exists
    if (attemptId && userId) {
      await client.query(
        `UPDATE user_quiz_attempts
         SET correct_answers = $1,
             score_percentage = $2,
             passed = $3,
             status = 'completed',
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND user_id = $5`,
        [correctAnswers, percentage, passed, attemptId, userId]
      );
      console.log('✅ Attempt record updated');
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      result: {
        quizId: parseInt(quizId),
        quizTitle: quiz.title,
        attemptId: attemptId,
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
        wrongAnswers: totalQuestions - correctAnswers,
        score: score,
        percentage: percentage,
        passed: passed,
        passingScore: quiz.passing_score || 70
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Submit quiz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  } finally {
    client.release();
  }
};

/**
 * Get quiz attempt review/details
 * GET /api/quizzes/attempts/:attemptId/review
 */
const getQuizAttemptReview = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.id || null;

    console.log('📖 Getting quiz review:', { attemptId, userId });

    // Get attempt details
    const attemptResult = await pool.query(
      `SELECT uqa.*, q.title, q.passing_score
       FROM user_quiz_attempts uqa
       JOIN quizzes q ON uqa.quiz_id = q.id
       WHERE uqa.id = $1`,
      [attemptId]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }

    const attempt = attemptResult.rows[0];

    // Check if user has permission to view (optional - if auth is enabled)
    if (userId && attempt.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get detailed answers with questions
    const answersResult = await pool.query(
      `SELECT
        uqa.question_id,
        uqa.selected_answer as your_answer,
        uqa.is_correct,
        qq.question_text,
        qq.option_a,
        qq.option_b,
        qq.option_c,
        qq.option_d,
        qq.correct_answer,
        qq.explanation
       FROM user_quiz_answers uqa
       JOIN quiz_questions qq ON uqa.question_id = qq.id
       WHERE uqa.attempt_id = $1
       ORDER BY qq.question_order, qq.id`,
      [attemptId]
    );

    res.json({
      success: true,
      attempt: {
        id: attempt.id,
        quizTitle: attempt.title,
        totalQuestions: attempt.total_questions,
        correctAnswers: attempt.correct_answers,
        scorePercentage: attempt.score_percentage,
        passed: attempt.passed,
        passingScore: attempt.passing_score,
        completedAt: attempt.completed_at
      },
      questions: answersResult.rows
    });
  } catch (err) {
    console.error('❌ Get quiz review error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get user's quiz history
 * GET /api/users/quiz-history
 */
const getUserQuizHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
        uqa.id as attempt_id,
        q.id as quiz_id,
        q.title as quiz_name,
        uqa.total_questions,
        uqa.correct_answers,
        uqa.score_percentage,
        uqa.passed,
        uqa.completed_at,
        uqa.started_at
       FROM user_quiz_attempts uqa
       JOIN quizzes q ON uqa.quiz_id = q.id
       WHERE uqa.user_id = $1 AND uqa.status = 'completed'
       ORDER BY uqa.completed_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      total: result.rows.length,
      history: result.rows
    });
  } catch (err) {
    console.error('❌ Get quiz history error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

module.exports = {
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttemptReview,
  getUserQuizHistory
};
