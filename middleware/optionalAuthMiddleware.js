const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Optional Authentication Middleware
 * If auth token is present, validate it and set req.user
 * If no auth token, just continue without blocking
 * This allows routes to work for both authenticated and guest users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // No token? No problem - continue as guest
    if (!token) {
      console.log('⚠️ No auth token - continuing as guest user');
      req.user = null;
      return next();
    }

    try {
      // Token provided - validate it
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database with role information
      const result = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, r.role_name as role, u.created_at
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [decoded.id]
      );

      if (result.rows.length === 0) {
        console.warn('⚠️ Token valid but user not found - continuing as guest');
        req.user = null;
        return next();
      }

      // User found - set req.user
      req.user = result.rows[0];
      console.log('✅ Authenticated user:', req.user.email);
      next();
    } catch (jwtError) {
      // Invalid/expired token - continue as guest anyway
      console.warn('⚠️ Invalid/expired token - continuing as guest:', jwtError.message);
      req.user = null;
      next();
    }
  } catch (err) {
    // Unexpected error - log but don't block
    console.error('❌ Optional auth middleware error:', err.message);
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;
