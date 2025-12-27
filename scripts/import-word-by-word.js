/**
 * Import Word-by-Word Quran Data
 *
 * This script imports the word-by-word JSON data into PostgreSQL database
 * Usage: node scripts/import-word-by-word.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'myapp_db',
  user: process.env.DB_USER || 'myapp_user',
  password: process.env.DB_PASSWORD || 'myapp_password',
});

async function importWordByWord() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting Word-by-Word import...\n');

    // Read JSON file
    const jsonPath = path.join(__dirname, '../database/word-by-word.json');
    console.log('📖 Reading JSON file:', jsonPath);

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const words = Object.values(jsonData);

    console.log(`✅ Loaded ${words.length} words from JSON\n`);

    // Start transaction
    await client.query('BEGIN');

    // Clear existing data (optional - comment out if you want to preserve existing data)
    console.log('🗑️  Clearing existing word data...');
    await client.query('TRUNCATE TABLE quran_words CASCADE');

    // Prepare batch insert
    console.log('📝 Inserting words into database...');

    let inserted = 0;
    const batchSize = 1000;

    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);

      // Build bulk insert query
      const values = [];
      const placeholders = [];

      batch.forEach((word, index) => {
        const offset = index * 5;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
        );
        values.push(
          parseInt(word.surah),
          parseInt(word.ayah),
          parseInt(word.word),
          word.location,
          word.text
        );
      });

      const query = `
        INSERT INTO quran_words
          (surah_number, ayah_number, word_position, location, arabic_text)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (location) DO NOTHING
      `;

      await client.query(query, values);
      inserted += batch.length;

      // Progress indicator
      if (inserted % 10000 === 0 || inserted === words.length) {
        const progress = ((inserted / words.length) * 100).toFixed(1);
        console.log(`   Progress: ${inserted}/${words.length} (${progress}%)`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    // Get statistics
    const stats = await client.query(`
      SELECT
        COUNT(*) as total_words,
        COUNT(DISTINCT surah_number) as total_surahs,
        COUNT(DISTINCT CONCAT(surah_number, ':', ayah_number)) as total_ayahs
      FROM quran_words
    `);

    console.log('\n✅ Import completed successfully!');
    console.log('\n📊 Statistics:');
    console.log(`   Total Words: ${stats.rows[0].total_words}`);
    console.log(`   Total Surahs: ${stats.rows[0].total_surahs}`);
    console.log(`   Total Ayahs: ${stats.rows[0].total_ayahs}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Import failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run import
importWordByWord()
  .then(() => {
    console.log('\n🎉 Import process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
