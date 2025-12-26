const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running reading goals migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_reading_goals.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await pool.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('📋 Created tables:');
    console.log('   - user_reading_goals');
    console.log('   - user_reading_goal_surah_targets');
    console.log('   - user_reading_goal_juz_targets');
    console.log('   - user_reading_goal_topic_targets');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
