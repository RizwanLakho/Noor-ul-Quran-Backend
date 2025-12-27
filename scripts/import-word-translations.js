/**
 * Import Word-by-Word Translations
 *
 * This script imports the word-by-word translation JSON data into PostgreSQL database
 * Usage: node scripts/import-word-translations.js
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

async function importWordTranslations() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting Word Translations import...\n');

    // Read JSON file
    const jsonPath = path.join(__dirname, '../database/word-by-word-translation.json');
    console.log('📖 Reading JSON file:', jsonPath);

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const locations = Object.keys(jsonData);

    console.log(`✅ Loaded ${locations.length} word translations from JSON\n`);

    // Start transaction
    await client.query('BEGIN');

    // Clear existing translations (optional - comment out if you want to preserve existing data)
    console.log('🗑️  Clearing existing word translations...');
    await client.query("DELETE FROM word_translations WHERE language_code = 'en'");

    // Prepare batch insert
    console.log('📝 Inserting word translations into database...');

    let inserted = 0;
    let skipped = 0;
    const batchSize = 1000;

    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);

      // Build bulk insert query
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const location of batch) {
        const translation = jsonData[location];

        // We need to get word_id from quran_words table using location
        // Using a subquery in the INSERT statement
        placeholders.push(
          `((SELECT id FROM quran_words WHERE location = $${paramIndex}), $${paramIndex + 1}, $${paramIndex + 2})`
        );
        values.push(location, 'en', translation);
        paramIndex += 3;
      }

      const query = `
        INSERT INTO word_translations (word_id, language_code, translation)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (word_id, language_code) DO UPDATE
        SET translation = EXCLUDED.translation
      `;

      try {
        const result = await client.query(query, values);
        inserted += result.rowCount;
      } catch (error) {
        console.error(`Error inserting batch at index ${i}:`, error.message);
        skipped += batch.length;
      }

      // Progress indicator
      if ((i + batch.length) % 10000 === 0 || (i + batch.length) >= locations.length) {
        const progress = (((i + batch.length) / locations.length) * 100).toFixed(1);
        console.log(`   Progress: ${i + batch.length}/${locations.length} (${progress}%)`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    // Get statistics
    const stats = await client.query(`
      SELECT
        COUNT(*) as total_translations,
        COUNT(DISTINCT word_id) as unique_words,
        COUNT(DISTINCT language_code) as languages
      FROM word_translations
    `);

    console.log('\n✅ Import completed successfully!');
    console.log('\n📊 Statistics:');
    console.log(`   Total Translations: ${stats.rows[0].total_translations}`);
    console.log(`   Unique Words: ${stats.rows[0].unique_words}`);
    console.log(`   Languages: ${stats.rows[0].languages}`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Skipped: ${skipped}`);

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
importWordTranslations()
  .then(() => {
    console.log('\n🎉 Import process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
