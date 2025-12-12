const pool = require("../config/db");

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("🔄 Starting migration...");

    // Start transaction
    await client.query("BEGIN");

    // Step 1: Add new columns
    console.log("📝 Adding first_name and last_name columns...");
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(50),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);
    `);

    // Step 2: Migrate existing data
    console.log("📝 Migrating existing username data...");
    await client.query(`
      UPDATE users
      SET
        first_name = COALESCE(first_name, SPLIT_PART(username, ' ', 1)),
        last_name = COALESCE(last_name, CASE
          WHEN SPLIT_PART(username, ' ', 2) = '' THEN 'User'
          ELSE SPLIT_PART(username, ' ', 2)
        END)
      WHERE first_name IS NULL OR last_name IS NULL;
    `);

    // Step 3: Make columns NOT NULL
    console.log("📝 Setting columns as NOT NULL...");
    await client.query(`
      ALTER TABLE users
      ALTER COLUMN first_name SET NOT NULL,
      ALTER COLUMN last_name SET NOT NULL;
    `);

    // Step 4: (Optional) Remove username column
    console.log("📝 Checking if username column should be dropped...");
    const dropUsername = false; // Set to true if you want to drop username column

    if (dropUsername) {
      await client.query(`
        ALTER TABLE users DROP COLUMN IF EXISTS username;
      `);
      console.log("✅ Username column dropped");
    } else {
      console.log("⏭️  Keeping username column for now");
    }

    // Commit transaction
    await client.query("COMMIT");

    console.log("✅ Migration completed successfully!");

    // Show updated schema
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 Current users table schema:");
    console.table(result.rows);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", err.message);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

migrate()
  .then(() => {
    console.log("\n🎉 All done! You can now test your auth endpoints.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n💥 Error:", err);
    process.exit(1);
  });
