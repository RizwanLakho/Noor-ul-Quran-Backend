const pool = require('../config/db');

/**
 * Get user's reading goals
 * GET /api/reading-goals
 */
const getReadingGoals = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get active goals (not yet ended)
    const goalsResult = await pool.query(
      `SELECT
        id,
        title,
        description,
        duration_value,
        duration_unit,
        start_date,
        end_date,
        completed,
        created_at,
        updated_at
      FROM user_reading_goals
      WHERE user_id = $1 AND end_date > NOW()
      ORDER BY created_at DESC`,
      [userId]
    );

    // For each goal, get its targets
    const goals = await Promise.all(
      goalsResult.rows.map(async (goal) => {
        // Get Surah targets
        const surahsResult = await pool.query(
          `SELECT surah_number, surah_name, completed
          FROM user_reading_goal_surah_targets
          WHERE goal_id = $1
          ORDER BY surah_number`,
          [goal.id]
        );

        // Get Juz targets
        const juzResult = await pool.query(
          `SELECT juz_number, juz_name, completed
          FROM user_reading_goal_juz_targets
          WHERE goal_id = $1
          ORDER BY juz_number`,
          [goal.id]
        );

        // Get Topic targets
        const topicsResult = await pool.query(
          `SELECT topic_id, topic_name, completed
          FROM user_reading_goal_topic_targets
          WHERE goal_id = $1
          ORDER BY topic_id`,
          [goal.id]
        );

        // Calculate progress
        const totalTargets =
          surahsResult.rows.length +
          juzResult.rows.length +
          topicsResult.rows.length;

        const completedTargets =
          surahsResult.rows.filter((s) => s.completed).length +
          juzResult.rows.filter((j) => j.completed).length +
          topicsResult.rows.filter((t) => t.completed).length;

        return {
          id: goal.id.toString(),
          title: goal.title,
          description: goal.description,
          duration: {
            value: goal.duration_value,
            unit: goal.duration_unit,
          },
          startDate: new Date(goal.start_date).getTime(),
          endDate: new Date(goal.end_date).getTime(),
          targets: {
            surahs: surahsResult.rows.map((s) => ({
              id: s.surah_number,
              name: s.surah_name,
              completed: s.completed,
            })),
            juz: juzResult.rows.map((j) => ({
              id: j.juz_number,
              name: j.juz_name,
              completed: j.completed,
            })),
            topics: topicsResult.rows.map((t) => ({
              id: t.topic_id,
              name: t.topic_name,
              completed: t.completed,
            })),
            quizzes: [], // Empty array for quiz targets (not yet implemented)
          },
          progress: {
            surahs: surahsResult.rows.filter((s) => s.completed).length,
            juz: juzResult.rows.filter((j) => j.completed).length,
            topics: topicsResult.rows.filter((t) => t.completed).length,
            total: completedTargets,
            percentage:
              totalTargets > 0 ? (completedTargets / totalTargets) * 100 : 0,
          },
          completed: goal.completed,
          createdAt: new Date(goal.created_at).getTime(),
          updatedAt: new Date(goal.updated_at).getTime(),
        };
      })
    );

    res.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error('❌ Error getting reading goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reading goals',
      error: error.message,
    });
  }
};

/**
 * Create a new reading goal
 * POST /api/reading-goals
 */
const createReadingGoal = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const {
      title,
      description,
      durationValue,
      durationUnit,
      selectedSurahs,
      selectedJuz,
      selectedTopics,
    } = req.body;

    // Validation
    if (!title || !durationValue || !durationUnit) {
      return res.status(400).json({
        success: false,
        message: 'Title, duration value, and duration unit are required',
      });
    }

    // Check if user already has 3 active goals
    const activeGoalsCount = await client.query(
      'SELECT COUNT(*) FROM user_reading_goals WHERE user_id = $1 AND end_date > NOW()',
      [userId]
    );

    if (parseInt(activeGoalsCount.rows[0].count) >= 3) {
      return res.status(400).json({
        success: false,
        message:
          'You can only have 3 active goals. Please complete or delete an existing goal first.',
      });
    }

    await client.query('BEGIN');

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);

    switch (durationUnit) {
      case 'days':
        endDate.setDate(endDate.getDate() + durationValue);
        break;
      case 'weeks':
        endDate.setDate(endDate.getDate() + durationValue * 7);
        break;
      case 'months':
        endDate.setMonth(endDate.getMonth() + durationValue);
        break;
      case 'year':
        endDate.setFullYear(endDate.getFullYear() + durationValue);
        break;
    }

    // Insert goal
    const goalResult = await client.query(
      `INSERT INTO user_reading_goals
        (user_id, title, description, duration_value, duration_unit, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [userId, title, description || '', durationValue, durationUnit, startDate, endDate]
    );

    const goalId = goalResult.rows[0].id;

    // Insert Surah targets
    if (selectedSurahs && selectedSurahs.length > 0) {
      for (const surah of selectedSurahs) {
        await client.query(
          `INSERT INTO user_reading_goal_surah_targets (goal_id, surah_number, surah_name)
          VALUES ($1, $2, $3)`,
          [goalId, surah.id, surah.name]
        );
      }
    }

    // Insert Juz targets
    if (selectedJuz && selectedJuz.length > 0) {
      for (const juz of selectedJuz) {
        await client.query(
          `INSERT INTO user_reading_goal_juz_targets (goal_id, juz_number, juz_name)
          VALUES ($1, $2, $3)`,
          [goalId, juz.id, juz.name]
        );
      }
    }

    // Insert Topic targets
    if (selectedTopics && selectedTopics.length > 0) {
      for (const topic of selectedTopics) {
        await client.query(
          `INSERT INTO user_reading_goal_topic_targets (goal_id, topic_id, topic_name)
          VALUES ($1, $2, $3)`,
          [goalId, topic.id, topic.name]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: { id: goalId },
      message: 'Reading goal created successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating reading goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reading goal',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * Update a reading goal
 * PUT /api/reading-goals/:id
 */
const updateReadingGoal = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const goalId = req.params.id;
    const {
      title,
      description,
      durationValue,
      durationUnit,
      selectedSurahs,
      selectedJuz,
      selectedTopics,
    } = req.body;

    // Check if goal belongs to user
    const goalCheck = await client.query(
      'SELECT start_date FROM user_reading_goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (goalCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    await client.query('BEGIN');

    // Calculate new end date from original start date
    const startDate = new Date(goalCheck.rows[0].start_date);
    const endDate = new Date(startDate);

    switch (durationUnit) {
      case 'days':
        endDate.setDate(endDate.getDate() + durationValue);
        break;
      case 'weeks':
        endDate.setDate(endDate.getDate() + durationValue * 7);
        break;
      case 'months':
        endDate.setMonth(endDate.getMonth() + durationValue);
        break;
      case 'year':
        endDate.setFullYear(endDate.getFullYear() + durationValue);
        break;
    }

    // Update goal
    await client.query(
      `UPDATE user_reading_goals
      SET title = $1, description = $2, duration_value = $3, duration_unit = $4, end_date = $5, updated_at = NOW()
      WHERE id = $6`,
      [title, description || '', durationValue, durationUnit, endDate, goalId]
    );

    // Delete old targets
    await client.query('DELETE FROM user_reading_goal_surah_targets WHERE goal_id = $1', [
      goalId,
    ]);
    await client.query('DELETE FROM user_reading_goal_juz_targets WHERE goal_id = $1', [goalId]);
    await client.query('DELETE FROM user_reading_goal_topic_targets WHERE goal_id = $1', [
      goalId,
    ]);

    // Insert new Surah targets
    if (selectedSurahs && selectedSurahs.length > 0) {
      for (const surah of selectedSurahs) {
        await client.query(
          `INSERT INTO user_reading_goal_surah_targets (goal_id, surah_number, surah_name)
          VALUES ($1, $2, $3)`,
          [goalId, surah.id, surah.name]
        );
      }
    }

    // Insert new Juz targets
    if (selectedJuz && selectedJuz.length > 0) {
      for (const juz of selectedJuz) {
        await client.query(
          `INSERT INTO user_reading_goal_juz_targets (goal_id, juz_number, juz_name)
          VALUES ($1, $2, $3)`,
          [goalId, juz.id, juz.name]
        );
      }
    }

    // Insert new Topic targets
    if (selectedTopics && selectedTopics.length > 0) {
      for (const topic of selectedTopics) {
        await client.query(
          `INSERT INTO user_reading_goal_topic_targets (goal_id, topic_id, topic_name)
          VALUES ($1, $2, $3)`,
          [goalId, topic.id, topic.name]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Reading goal updated successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating reading goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reading goal',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * Delete a reading goal
 * DELETE /api/reading-goals/:id
 */
const deleteReadingGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;

    const result = await pool.query(
      'DELETE FROM user_reading_goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [goalId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    res.json({
      success: true,
      message: 'Reading goal deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting reading goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reading goal',
      error: error.message,
    });
  }
};

/**
 * Mark a target item as completed
 * POST /api/reading-goals/:id/complete
 */
const markTargetCompleted = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;
    const { type, itemId } = req.body;

    // Verify goal belongs to user
    const goalCheck = await pool.query(
      'SELECT id FROM user_reading_goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (goalCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    // Mark target as completed based on type
    let query;
    switch (type) {
      case 'surah':
        query = `UPDATE user_reading_goal_surah_targets
                SET completed = true
                WHERE goal_id = $1 AND surah_number = $2`;
        break;
      case 'juz':
        query = `UPDATE user_reading_goal_juz_targets
                SET completed = true
                WHERE goal_id = $1 AND juz_number = $2`;
        break;
      case 'topic':
        query = `UPDATE user_reading_goal_topic_targets
                SET completed = true
                WHERE goal_id = $1 AND topic_id = $2`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid target type',
        });
    }

    await pool.query(query, [goalId, itemId]);

    // Update last_progress_update timestamp
    await pool.query(
      'UPDATE user_reading_goals SET last_progress_update = NOW(), updated_at = NOW() WHERE id = $1',
      [goalId]
    );

    // Check if all targets are completed and mark goal as completed
    const surahsCount = await pool.query(
      'SELECT COUNT(*) FROM user_reading_goal_surah_targets WHERE goal_id = $1',
      [goalId]
    );
    const surahsCompleted = await pool.query(
      'SELECT COUNT(*) FROM user_reading_goal_surah_targets WHERE goal_id = $1 AND completed = true',
      [goalId]
    );

    const juzCount = await pool.query(
      'SELECT COUNT(*) FROM user_reading_goal_juz_targets WHERE goal_id = $1',
      [goalId]
    );
    const juzCompleted = await pool.query(
      'SELECT COUNT(*) FROM user_reading_goal_juz_targets WHERE goal_id = $1 AND completed = true',
      [goalId]
    );

    const topicsCount = await pool.query(
      'SELECT COUNT(*) FROM user_reading_goal_topic_targets WHERE goal_id = $1',
      [goalId]
    );
    const topicsCompleted = await pool.query(
      'SELECT COUNT(*) FROM user_reading_goal_topic_targets WHERE goal_id = $1 AND completed = true',
      [goalId]
    );

    const totalTargets =
      parseInt(surahsCount.rows[0].count) +
      parseInt(juzCount.rows[0].count) +
      parseInt(topicsCount.rows[0].count);

    const totalCompleted =
      parseInt(surahsCompleted.rows[0].count) +
      parseInt(juzCompleted.rows[0].count) +
      parseInt(topicsCompleted.rows[0].count);

    if (totalTargets > 0 && totalCompleted === totalTargets) {
      await pool.query(
        'UPDATE user_reading_goals SET completed = true, updated_at = NOW() WHERE id = $1',
        [goalId]
      );
    }

    res.json({
      success: true,
      message: 'Target marked as completed',
    });
  } catch (error) {
    console.error('❌ Error marking target completed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark target as completed',
      error: error.message,
    });
  }
};

module.exports = {
  getReadingGoals,
  createReadingGoal,
  updateReadingGoal,
  deleteReadingGoal,
  markTargetCompleted,
};
