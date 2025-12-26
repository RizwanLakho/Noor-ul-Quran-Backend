const cron = require('node-cron');
const pool = require('../config/db');
const {
  createGoalReminderNotification,
  createVerseOfDayNotification,
} = require('../controllers/notificationsController');

/**
 * Check for goals with no progress in 24 hours and send reminders
 */
const checkGoalsForReminders = async () => {
  try {
    console.log('🔔 Checking goals for reminders...');

    // Get all active goals where:
    // 1. Goal is not completed
    // 2. Last progress update was more than 24 hours ago (or never updated)
    const query = `
      SELECT DISTINCT
        rg.id,
        rg.user_id,
        rg.title,
        rg.last_progress_update
      FROM user_reading_goals rg
      WHERE rg.completed = false
        AND rg.end_date > CURRENT_DATE
        AND (
          rg.last_progress_update IS NULL
          OR rg.last_progress_update < NOW() - INTERVAL '24 hours'
        )
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('✅ No goals need reminders');
      return;
    }

    console.log(`📬 Sending ${result.rows.length} goal reminders...`);

    // Send reminder notification for each goal
    for (const goal of result.rows) {
      try {
        await createGoalReminderNotification(goal.user_id, goal.title);
      } catch (error) {
        console.error(`Failed to send reminder for goal ${goal.id}:`, error);
      }
    }

    console.log(`✅ Sent ${result.rows.length} goal reminder notifications`);
  } catch (error) {
    console.error('❌ Error checking goals for reminders:', error);
  }
};

/**
 * Send verse of the day notification to all users
 */
const sendVerseOfDayNotifications = async () => {
  try {
    console.log('📖 Sending verse of the day notifications...');

    // Get all active users
    const usersResult = await pool.query(
      'SELECT id FROM users WHERE is_verified = true'
    );

    if (usersResult.rows.length === 0) {
      console.log('⚠️ No verified users found');
      return;
    }

    // Get a random ayah
    const ayahResult = await pool.query(`
      SELECT
        sura as surah_number,
        aya as ayah_number
      FROM quran
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (ayahResult.rows.length === 0) {
      console.log('⚠️ No ayah found');
      return;
    }

    const ayah = ayahResult.rows[0];
    const verseReference = `${ayah.surah_number}:${ayah.ayah_number}`;

    console.log(`📬 Sending verse ${verseReference} to ${usersResult.rows.length} users...`);

    // Send notification to each user
    for (const user of usersResult.rows) {
      try {
        await createVerseOfDayNotification(user.id, verseReference);
      } catch (error) {
        console.error(`Failed to send verse notification to user ${user.id}:`, error);
      }
    }

    console.log(`✅ Sent ${usersResult.rows.length} verse of the day notifications`);
  } catch (error) {
    console.error('❌ Error sending verse of the day notifications:', error);
  }
};

/**
 * Initialize scheduled tasks
 */
const initializeScheduler = () => {
  console.log('⏰ Initializing notification scheduler...');

  // Check for goal reminders every hour
  cron.schedule('0 * * * *', () => {
    console.log('⏰ Running hourly goal reminder check...');
    checkGoalsForReminders();
  });

  // Send verse of the day at 6:00 AM every day
  cron.schedule('0 6 * * *', () => {
    console.log('⏰ Running daily verse of the day notification...');
    sendVerseOfDayNotifications();
  });

  // Run immediately on startup for testing (optional - comment out in production)
  setTimeout(() => {
    console.log('🚀 Running initial notification check...');
    checkGoalsForReminders();
  }, 5000); // Wait 5 seconds after server starts

  console.log('✅ Notification scheduler initialized');
  console.log('📅 Goal reminders: Every hour');
  console.log('📅 Verse of the day: Daily at 6:00 AM');
};

module.exports = {
  initializeScheduler,
  checkGoalsForReminders,
  sendVerseOfDayNotifications,
};
