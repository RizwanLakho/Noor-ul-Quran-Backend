const pool = require('../config/db');

/**
 * Update user streak
 * Called whenever user opens the app or completes an activity
 * POST /api/users/me/streak/update
 */
const updateStreak = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Get or create user streak record
    const existingStreak = await pool.query(
      'SELECT * FROM user_streaks WHERE user_id = $1',
      [userId]
    );

    if (existingStreak.rows.length === 0) {
      // Create new streak record
      const newStreak = await pool.query(
        `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
         VALUES ($1, 1, 1, $2)
         RETURNING *`,
        [userId, today]
      );

      return res.json({
        success: true,
        data: {
          currentStreak: newStreak.rows[0].current_streak,
          longestStreak: newStreak.rows[0].longest_streak,
        },
      });
    }

    const streakData = existingStreak.rows[0];
    const lastActivityDate = streakData.last_activity_date
      ? new Date(streakData.last_activity_date).toISOString().split('T')[0]
      : null;

    // Check if user already logged activity today
    if (lastActivityDate === today) {
      return res.json({
        success: true,
        data: {
          currentStreak: streakData.current_streak,
          longestStreak: streakData.longest_streak,
        },
        message: 'Streak already updated today',
      });
    }

    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newCurrentStreak;
    let newLongestStreak = streakData.longest_streak;

    if (lastActivityDate === yesterdayStr) {
      // Consecutive day - increment streak
      newCurrentStreak = streakData.current_streak + 1;

      // Update longest streak if current exceeds it
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }
    } else {
      // Streak broken - reset to 1
      newCurrentStreak = 1;
    }

    // Update the streak
    const updatedStreak = await pool.query(
      `UPDATE user_streaks
       SET current_streak = $1, longest_streak = $2, last_activity_date = $3
       WHERE user_id = $4
       RETURNING *`,
      [newCurrentStreak, newLongestStreak, today, userId]
    );

    res.json({
      success: true,
      data: {
        currentStreak: updatedStreak.rows[0].current_streak,
        longestStreak: updatedStreak.rows[0].longest_streak,
      },
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update streak',
    });
  }
};

/**
 * Get user streak
 * GET /api/users/me/streak
 */
const getStreak = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          currentStreak: 0,
          longestStreak: 0,
        },
      });
    }

    const streakData = result.rows[0];

    // Check if streak is still valid (last activity was yesterday or today)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastActivityDate = streakData.last_activity_date
      ? new Date(streakData.last_activity_date).toISOString().split('T')[0]
      : null;

    let currentStreak = streakData.current_streak;

    // If last activity was not yesterday or today, reset current streak to 0
    if (lastActivityDate !== today && lastActivityDate !== yesterdayStr) {
      currentStreak = 0;
    }

    res.json({
      success: true,
      data: {
        currentStreak: currentStreak,
        longestStreak: streakData.longest_streak,
      },
    });
  } catch (error) {
    console.error('Error getting streak:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get streak',
    });
  }
};

module.exports = {
  updateStreak,
  getStreak,
};
