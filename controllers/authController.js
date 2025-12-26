const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
} = require("../services/emailService");

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Generate JWT Token
const generateToken = (userId, email) => {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: "30d" }
  );
};

// Log login attempt
const logLoginAttempt = async (userId, ipAddress, userAgent, success, failureReason = null) => {
  try {
    await pool.query(
      `INSERT INTO user_login_history (user_id, ip_address, user_agent, success, failure_reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, ipAddress, userAgent, success, failureReason]
    );
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
};

// =====================================================
// REGISTER / SIGNUP
// =====================================================

exports.register = async (req, res) => {
  console.log("📝 Registration request received");
  const { first_name, last_name, email, password, firstName, lastName } = req.body;

  // Support both naming conventions
  const userFirstName = first_name || firstName;
  const userLastName = last_name || lastName;

  // Validation
  if (!userFirstName || !userLastName || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
      required: ["first_name/firstName", "last_name/lastName", "email", "password"],
    });
  }

  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 8 characters long"
    });
  }

  if (!/\d/.test(password)) {
    return res.status(400).json({
      success: false,
      error: "Password must contain at least one number"
    });
  }

  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({
      success: false,
      error: "Password must contain at least one uppercase letter"
    });
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return res.status(400).json({
      success: false,
      error: "Password must contain at least one special character"
    });
  }

  try {
    // Check if user exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Email already registered. Please login or use a different email."
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const newUser = await pool.query(
      `INSERT INTO users (
        first_name, last_name, email, password,
        verification_token, verification_token_expires,
        provider, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'email', NOW())
      RETURNING id, first_name, last_name, email, email_verified, created_at`,
      [userFirstName, userLastName, email.toLowerCase(), hashedPassword, verificationToken, tokenExpiry]
    );

    const user = newUser.rows[0];

    // Log verification email send
    await pool.query(
      `INSERT INTO email_verification_log (user_id, email, token, sent_at)
       VALUES ($1, $2, $3, NOW())`,
      [user.id, email, verificationToken]
    );

    // Send verification email
    let emailSent = false;
    try {
      await sendVerificationEmail(email, userFirstName, verificationToken);
      emailSent = true;
      console.log('✅ Verification email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      message: emailSent
        ? "Registration successful! Please check your email to verify your account."
        : "Registration successful! Email verification pending.",
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          emailVerified: user.email_verified,
          createdAt: user.created_at
        },
        token
      }
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during registration. Please try again."
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

exports.login = async (req, res) => {
  console.log("🔐 Login request received");
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required"
    });
  }

  try {
    // Find user with role
    const result = await pool.query(
      `SELECT u.*, r.role_name as role
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({
        success: false,
        error: "Account temporarily locked due to too many failed attempts. Please try again later."
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment login attempts
      const attempts = (user.login_attempts || 0) + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lock for 15 minutes after 5 attempts

      await pool.query(
        `UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3`,
        [attempts, lockUntil, user.id]
      );

      await logLoginAttempt(user.id, ipAddress, userAgent, false, 'Invalid password');

      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        attemptsRemaining: Math.max(0, 5 - attempts)
      });
    }

    // Check if email is verified - REQUIRED for security
    if (!user.email_verified && user.provider === 'email') {
      return res.status(403).json({
        success: false,
        error: "Please verify your email before logging in",
        requiresVerification: true,
        email: user.email
      });
    }

    // Reset login attempts on successful login
    await pool.query(
      `UPDATE users SET
        login_attempts = 0,
        locked_until = NULL,
        last_login = NOW()
       WHERE id = $1`,
      [user.id]
    );

    // Log successful login
    await logLoginAttempt(user.id, ipAddress, userAgent, true);

    // Generate token
    const token = generateToken(user.id, user.email);

    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      message: "Login successful!",
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          emailVerified: user.email_verified,
          profilePicture: user.profile_picture,
          lastLogin: new Date()
        },
        token
      }
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during login. Please try again."
    });
  }
};

// =====================================================
// VERIFY EMAIL
// =====================================================

exports.verifyEmail = async (req, res) => {
  console.log("✉️ Email verification request");
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Verification token is required"
    });
  }

  try {
    // Support both full token and 6-character code
    let result;
    if (token.length === 6) {
      // Short code verification - match first 6 characters of token (case-insensitive)
      result = await pool.query(
        `SELECT * FROM users
         WHERE UPPER(LEFT(verification_token, 6)) = UPPER($1)
         AND verification_token_expires > NOW()`,
        [token]
      );
    } else {
      // Full token verification
      result = await pool.query(
        `SELECT * FROM users
         WHERE verification_token = $1
         AND verification_token_expires > NOW()`,
        [token]
      );
    }

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification code"
      });
    }

    const user = result.rows[0];

    // Mark email as verified
    await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           verification_token = NULL,
           verification_token_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    // Log verification
    await pool.query(
      `UPDATE email_verification_log
       SET verified_at = NOW()
       WHERE token = $1`,
      [token]
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.first_name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    console.log('✅ Email verified for:', user.email);

    res.json({
      success: true,
      message: "Email verified successfully! You can now log in with full access."
    });

  } catch (error) {
    console.error("❌ Email verification error:", error);
    res.status(500).json({
      success: false,
      error: "Verification failed. Please try again."
    });
  }
};

// =====================================================
// RESEND VERIFICATION EMAIL
// =====================================================

exports.resendVerification = async (req, res) => {
  console.log("📧 Resend verification request");
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Email is required"
    });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Email not found"
      });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: "Email already verified"
      });
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET verification_token = $1, verification_token_expires = $2
       WHERE id = $3`,
      [verificationToken, tokenExpiry, user.id]
    );

    // Log new email send
    await pool.query(
      `INSERT INTO email_verification_log (user_id, email, token, sent_at)
       VALUES ($1, $2, $3, NOW())`,
      [user.id, email, verificationToken]
    );

    // Send email
    await sendVerificationEmail(email, user.first_name, verificationToken);

    console.log('✅ Verification email resent to:', email);

    res.json({
      success: true,
      message: "Verification email sent! Please check your inbox."
    });

  } catch (error) {
    console.error("❌ Resend verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resend verification email. Please try again."
    });
  }
};

// =====================================================
// FORGOT PASSWORD
// =====================================================

exports.forgotPassword = async (req, res) => {
  console.log("🔑 Forgot password request");
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Email is required"
    });
  }

  try {
    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success message for security (don't reveal if email exists)
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: "If your email is registered, you will receive a password reset code shortly."
      });
    }

    const user = result.rows[0];

    // Allow password reset for all users (verified or not)
    // This helps users who forgot password before verifying email

    // Generate reset token (6-digit code similar to email verification)
    const resetToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await pool.query(
      `UPDATE users
       SET reset_password_token = $1,
           reset_password_expires = $2
       WHERE id = $3`,
      [resetToken, tokenExpiry, user.id]
    );

    // Send password reset email with OTP
    try {
      await sendPasswordResetEmail(email, user.first_name, resetToken);
      console.log('✅ Password reset email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send reset email:', emailError);
      return res.status(500).json({
        success: false,
        error: "Failed to send reset email. Please try again."
      });
    }

    res.json({
      success: true,
      message: "Password reset code sent to your email. Please check your inbox."
    });

  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Server error. Please try again."
    });
  }
};

// =====================================================
// RESET PASSWORD
// =====================================================

exports.resetPassword = async (req, res) => {
  console.log("🔐 Reset password request");
  const { token, newPassword, email } = req.body;

  // Validation
  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: "Reset code and new password are required"
    });
  }

  // Password strength validation
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 8 characters long"
    });
  }

  if (!/\d/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: "Password must contain at least one number"
    });
  }

  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: "Password must contain at least one uppercase letter"
    });
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: "Password must contain at least one special character"
    });
  }

  try {
    // Support both full token and 6-character code
    let result;
    if (token.length === 6) {
      // Short code verification - match first 6 characters (case-insensitive)
      result = await pool.query(
        `SELECT * FROM users
         WHERE UPPER(LEFT(reset_password_token, 6)) = UPPER($1)
         AND reset_password_expires > NOW()`,
        [token]
      );
    } else {
      // Full token verification
      result = await pool.query(
        `SELECT * FROM users
         WHERE reset_password_token = $1
         AND reset_password_expires > NOW()`,
        [token]
      );
    }

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset code. Please request a new one."
      });
    }

    const user = result.rows[0];

    // If email is provided, verify it matches
    if (email && user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: "Reset code does not match the email provided"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await pool.query(
      `UPDATE users
       SET password = $1,
           reset_password_token = NULL,
           reset_password_expires = NULL,
           login_attempts = 0,
           locked_until = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    console.log('✅ Password reset successful for:', user.email);

    res.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password."
    });

  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password. Please try again."
    });
  }
};

// =====================================================
// GOOGLE OAuth
// =====================================================

exports.googleAuth = async (req, res) => {
  console.log("🔵 Google OAuth request");
  const { idToken, email, firstName, lastName, profilePicture } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Email is required for Google authentication"
    });
  }

  try {
    // Check if user exists
    let result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    let user;

    if (result.rows.length === 0) {
      // Create new user
      result = await pool.query(
        `INSERT INTO users (
          first_name, last_name, email, password,
          email_verified, provider, provider_id, profile_picture, created_at
        ) VALUES ($1, $2, $3, $4, TRUE, 'google', $5, $6, NOW())
        RETURNING *`,
        [firstName, lastName, email.toLowerCase(), '', idToken, profilePicture]
      );
      user = result.rows[0];
      console.log('✅ New user created via Google:', email);
    } else {
      user = result.rows[0];

      // Update profile picture and last login
      await pool.query(
        `UPDATE users
         SET profile_picture = $1,
             last_login = NOW()
         WHERE id = $2`,
        [profilePicture, user.id]
      );
      console.log('✅ Existing user logged in via Google:', email);
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      message: "Google authentication successful!",
      data: {
        user: {
          id: user.id,
          firstName: user.first_name || firstName,
          lastName: user.last_name || lastName,
          email: user.email,
          emailVerified: true,
          profilePicture: profilePicture || user.profile_picture,
          provider: 'google'
        },
        token
      }
    });

  } catch (error) {
    console.error("❌ Google auth error:", error);
    res.status(500).json({
      success: false,
      error: "Google authentication failed. Please try again."
    });
  }
};

// =====================================================
// FACEBOOK OAuth
// =====================================================

exports.facebookAuth = async (req, res) => {
  console.log("🔵 Facebook OAuth request");
  const { accessToken, email, firstName, lastName, profilePicture } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Email is required for Facebook authentication"
    });
  }

  try {
    // Similar to Google OAuth
    let result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    let user;

    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO users (
          first_name, last_name, email, password,
          email_verified, provider, provider_id, profile_picture, created_at
        ) VALUES ($1, $2, $3, $4, TRUE, 'facebook', $5, $6, NOW())
        RETURNING *`,
        [firstName, lastName, email.toLowerCase(), '', accessToken, profilePicture]
      );
      user = result.rows[0];
    } else {
      user = result.rows[0];
      await pool.query(
        'UPDATE users SET profile_picture = $1, last_login = NOW() WHERE id = $2',
        [profilePicture, user.id]
      );
    }

    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      message: "Facebook authentication successful!",
      data: {
        user: {
          id: user.id,
          firstName: user.first_name || firstName,
          lastName: user.last_name || lastName,
          email: user.email,
          emailVerified: true,
          profilePicture: profilePicture || user.profile_picture,
          provider: 'facebook'
        },
        token
      }
    });

  } catch (error) {
    console.error("❌ Facebook auth error:", error);
    res.status(500).json({
      success: false,
      error: "Facebook authentication failed. Please try again."
    });
  }
};

// =====================================================
// GET CURRENT USER
// =====================================================

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    const result = await pool.query(
      `SELECT id, first_name, last_name, email, email_verified,
              profile_picture, provider, created_at, last_login
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          emailVerified: user.email_verified,
          profilePicture: user.profile_picture,
          provider: user.provider,
          createdAt: user.created_at,
          lastLogin: user.last_login
        }
      }
    });

  } catch (error) {
    console.error("❌ Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user data"
    });
  }
};

module.exports = exports;
