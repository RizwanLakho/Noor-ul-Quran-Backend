/**
 * Manually Verify User Script
 * Use this to verify a user when email service is not working
 */

require('dotenv').config();
const pool = require('./config/db');

const verifyUser = async (email) => {
  try {
    console.log('🔍 Looking for user:', email);

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      console.error('❌ User not found with email:', email);
      console.log('\n💡 Tip: Make sure the email is exactly as registered');
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✅ User found!');
    console.log('   Name:', user.first_name, user.last_name);
    console.log('   Email:', user.email);
    console.log('   Verified:', user.email_verified ? 'Yes' : 'No');
    console.log('   Created:', user.created_at);

    if (user.email_verified) {
      console.log('\n✅ User is already verified!');
      process.exit(0);
    }

    // Verify user
    await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           verification_token = NULL,
           verification_token_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    console.log('\n✅ User has been manually verified!');
    console.log('🎉 User can now login without email verification');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node verify-user-manually.js <email>');
  console.log('Example: node verify-user-manually.js user@example.com');
  process.exit(1);
}

verifyUser(email);
