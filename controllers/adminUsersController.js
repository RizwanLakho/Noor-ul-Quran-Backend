const pool = require('../config/db');

// Get all users with pagination and search
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        id,
        first_name,
        last_name,
        email,
        role,
        status,
        email_verified,
        provider,
        created_at,
        last_login,
        password_updated_at
      FROM users
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Add search filter
    if (search) {
      query += ` AND (
        first_name ILIKE $${paramCount} OR
        last_name ILIKE $${paramCount} OR
        email ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Add status filter
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users WHERE 1=1${
      search ? ` AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)` : ''
    }${status ? ` AND status = $${params.length}` : ''}`;

    const countResult = await pool.query(countQuery, params);
    const totalUsers = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users'
    });
  }
};

// Delete user by admin
exports.deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent deleting other admins
    if (userCheck.rows[0].role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete another admin account'
      });
    }

    // Delete user (CASCADE will delete related data)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    console.log(`✅ Admin ${req.user.email} deleted user ${userCheck.rows[0].email}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting user'
    });
  }
};

// Update user status (activate/deactivate)
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "active" or "inactive"'
      });
    }

    // Prevent admin from changing their own status
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot change your own account status'
      });
    }

    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, email, status',
      [status, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`✅ Admin ${req.user.email} changed user ${result.rows[0].email} status to ${status}`);

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Update user status error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while updating user status'
    });
  }
};
