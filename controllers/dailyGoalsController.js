const pool = require('../config/db');

/**
 * Get user's active daily goals
 * GET /api/goals/daily
 */
const getDailyGoals = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get goals that haven't expired yet
    const result = await pool.query(
      `SELECT
        id,
        title,
        description,
        target_value,
        current_value,
        goal_type,
        completed,
        created_at,
        expires_at
      FROM user_daily_goals
      WHERE user_id = $1 AND expires_at > NOW()
      ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Error getting daily goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily goals',
      error: error.message,
    });
  }
};

/**
 * Create a new daily goal
 * POST /api/goals
 */
const createGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, target_value, goal_type } = req.body;

    // Validation
    if (!title || !goal_type) {
      return res.status(400).json({
        success: false,
        message: 'Title and goal type are required',
      });
    }

    // Goal expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const result = await pool.query(
      `INSERT INTO user_daily_goals
        (user_id, title, description, target_value, current_value, goal_type, expires_at)
      VALUES ($1, $2, $3, $4, 0, $5, $6)
      RETURNING *`,
      [userId, title, description || '', target_value || 1, goal_type, expiresAt]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Goal created successfully',
    });
  } catch (error) {
    console.error('❌ Error creating goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create goal',
      error: error.message,
    });
  }
};

/**
 * Update goal progress
 * PUT /api/goals/:id
 */
const updateGoalProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;
    const { current_value, completed } = req.body;

    // Check if goal belongs to user
    const goalCheck = await pool.query(
      'SELECT * FROM user_daily_goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (goalCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    const goal = goalCheck.rows[0];

    // Update goal
    const newCurrentValue = current_value !== undefined ? current_value : goal.current_value;
    const isCompleted =
      completed !== undefined ? completed : newCurrentValue >= goal.target_value;

    const result = await pool.query(
      `UPDATE user_daily_goals
      SET current_value = $1, completed = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *`,
      [newCurrentValue, isCompleted, goalId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Goal updated successfully',
    });
  } catch (error) {
    console.error('❌ Error updating goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update goal',
      error: error.message,
    });
  }
};

/**
 * Delete a goal
 * DELETE /api/goals/:id
 */
const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;

    const result = await pool.query(
      'DELETE FROM user_daily_goals WHERE id = $1 AND user_id = $2 RETURNING *',
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
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete goal',
      error: error.message,
    });
  }
};

/**
 * Archive expired goals (runs automatically via cron or manually)
 * POST /api/goals/archive-expired
 */
const archiveExpiredGoals = async (req, res) => {
  try {
    // Move expired goals to archive table or mark them
    const result = await pool.query(
      `UPDATE user_daily_goals
      SET archived = true
      WHERE expires_at <= NOW() AND archived = false
      RETURNING id, user_id, title, completed`,
      []
    );

    res.json({
      success: true,
      message: `Archived ${result.rows.length} expired goals`,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Error archiving goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive expired goals',
      error: error.message,
    });
  }
};

module.exports = {
  getDailyGoals,
  createGoal,
  updateGoalProgress,
  deleteGoal,
  archiveExpiredGoals,
};
