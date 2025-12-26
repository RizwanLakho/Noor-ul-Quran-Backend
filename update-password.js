const pool = require('./config/db');
const bcrypt = require('bcrypt');

async function updatePassword() {
  try {
    const email = 'myofficeid192@gmail.com';
    const newPassword = 'Test@123';

    // Generate hash
    const hash = await bcrypt.hash(newPassword, 10);
    console.log('Generated hash:', hash);

    // Update using parameterized query
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING email',
      [hash, email]
    );

    console.log('✅ Password updated for:', result.rows[0].email);
    console.log('New password is: Test@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updatePassword();
