const pool = require('../config/db');

/**
 * Get user notifications
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only } = req.query;

    let query = `
      SELECT
        id,
        title,
        message,
        type,
        is_read,
        data,
        created_at,
        read_at
      FROM user_notifications
      WHERE user_id = $1
    `;

    const params = [userId];

    if (unread_only === 'true') {
      query += ' AND is_read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);

    // Get unread count
    const unreadCount = await pool.query(
      'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unreadCount: parseInt(unreadCount.rows[0].count) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE user_notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `UPDATE user_notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    });
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM user_notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
    });
  }
};

/**
 * Create notification (Internal use - for system/admin)
 * POST /api/notifications/create
 */
const createNotification = async (req, res) => {
  try {
    const { user_id, title, message, type, data } = req.body;

    if (!user_id || !title || !message || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const result = await pool.query(
      `INSERT INTO user_notifications (user_id, title, message, type, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, title, message, type, data || null]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
    });
  }
};

/**
 * Helper function to create goal reminder notification
 */
const createGoalReminderNotification = async (userId, goalTitle) => {
  try {
    await pool.query(
      `INSERT INTO user_notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        userId,
        'Goal Reminder',
        `You haven't made progress on "${goalTitle}" in 24 hours. Keep going!`,
        'goal_reminder',
      ]
    );
    console.log(`✅ Created goal reminder notification for user ${userId}`);
  } catch (error) {
    console.error('Error creating goal reminder:', error);
  }
};

/**
 * Helper function to create verse of day notification
 */
const createVerseOfDayNotification = async (userId, verseReference) => {
  try {
    await pool.query(
      `INSERT INTO user_notifications (user_id, title, message, type, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'Verse of the Day',
        'Check out today\'s verse!',
        'verse_of_day',
        JSON.stringify({ verseReference }),
      ]
    );
    console.log(`✅ Created verse of day notification for user ${userId}`);
  } catch (error) {
    console.error('Error creating verse notification:', error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  createGoalReminderNotification,
  createVerseOfDayNotification,
};
