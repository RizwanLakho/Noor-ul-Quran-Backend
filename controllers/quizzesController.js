const pool = require('../config/db');

// Get all quizzes
const getAllQuizzes = async (req, res) => {
  try {
    const query = `
      SELECT 
        q.*,
        COUNT(qq.id) as total_questions,
        COUNT(DISTINCT uqa.user_id) as total_attempts
      FROM quizzes q
      LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
      LEFT JOIN user_quiz_attempts uqa ON q.id = uqa.quiz_id
      WHERE q.is_active = true
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      total: result.rows.length,
      quizzes: result.rows
    });
  } catch (err) {
    console.error('Get quizzes error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get single quiz with questions
const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quizResult = await pool.query('SELECT * FROM quizzes WHERE id = $1', [id]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questionsResult = await pool.query(
      'SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY question_order, id',
      [id]
    );

    res.json({
      success: true,
      quiz: quizResult.rows[0],
      questions: questionsResult.rows
    });
  } catch (err) {
    console.error('Get quiz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Create quiz WITH questions
const createQuiz = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { title, description, difficulty, time_limit, passing_score, category, questions } = req.body;
    const userId = req.user.id;

    console.log('📝 Creating quiz:', { title, questionsCount: questions?.length });

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Insert quiz
    const quizResult = await client.query(
      `INSERT INTO quizzes (title, description, difficulty, time_limit, passing_score, category, question_count, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        title, 
        description, 
        difficulty || 'medium', 
        time_limit || 15, 
        passing_score || 70, 
        category || 'general',
        questions?.length || 0,
        userId
      ]
    );

    const quizId = quizResult.rows[0].id;
    console.log('✅ Quiz created with ID:', quizId);

    // Insert questions
    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await client.query(
          `INSERT INTO quiz_questions (
            quiz_id, 
            question_text, 
            option_a, 
            option_b, 
            option_c, 
            option_d, 
            correct_answer, 
            explanation,
            question_order,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            quizId, 
            q.question_text, 
            q.option_a, 
            q.option_b, 
            q.option_c, 
            q.option_d, 
            q.correct_answer, 
            q.explanation || null,
            i,
            userId
          ]
        );
      }
      console.log(`✅ ${questions.length} questions added`);
    }

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Quiz created successfully', 
      quiz: quizResult.rows[0] 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Create quiz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  } finally {
    client.release();
  }
};

// Update quiz WITH questions
const updateQuiz = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { title, description, difficulty, time_limit, passing_score, category, is_active, questions } = req.body;

    console.log('📝 Updating quiz:', { id, title, questionsCount: questions?.length });

    // Update quiz
    const quizResult = await client.query(
      `UPDATE quizzes 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           difficulty = COALESCE($3, difficulty), 
           time_limit = COALESCE($4, time_limit), 
           passing_score = COALESCE($5, passing_score), 
           category = COALESCE($6, category),
           question_count = COALESCE($7, question_count),
           is_active = COALESCE($8, is_active), 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9 
       RETURNING *`,
      [title, description, difficulty, time_limit, passing_score, category, questions?.length || 0, is_active, id]
    );

    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Delete existing questions
    await client.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [id]);
    console.log('🗑️ Old questions deleted');

    // Insert new questions
    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await client.query(
          `INSERT INTO quiz_questions (
            quiz_id, 
            question_text, 
            option_a, 
            option_b, 
            option_c, 
            option_d, 
            correct_answer, 
            explanation,
            question_order,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id, 
            q.question_text, 
            q.option_a, 
            q.option_b, 
            q.option_c, 
            q.option_d, 
            q.correct_answer, 
            q.explanation || null,
            i,
            req.user.id
          ]
        );
      }
      console.log(`✅ ${questions.length} questions updated`);
    }

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Quiz updated successfully',
      quiz: quizResult.rows[0] 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Update quiz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  } finally {
    client.release();
  }
};

// Delete quiz
const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM quizzes WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error('Delete quiz error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

module.exports = {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz
};
