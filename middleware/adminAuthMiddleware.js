const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Check if user is admin or superuser
    if (user.role !== 'admin' && user.role !== 'superuser') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Admin auth middleware error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = adminAuthMiddleware;
