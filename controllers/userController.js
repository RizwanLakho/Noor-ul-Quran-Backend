const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, first_name, last_name, email, created_at, updated_at FROM users WHERE id = $1",
      [req.user.id],
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = user.rows[0];
    console.log('📊 Profile request - User ID:', userData.id);

    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user profile (first_name, last_name)
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: "First name and last name are required" });
    }

    const result = await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3 RETURNING id, first_name, last_name, email, created_at",
      [first_name, last_name, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user email
exports.updateEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, req.user.id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const result = await pool.query(
      "UPDATE users SET email = $1 WHERE id = $2 RETURNING id, first_name, last_name, email, created_at",
      [email, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Email updated successfully",
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    // Get user with password
    const user = await pool.query(
      "SELECT id, password FROM users WHERE id = $1",
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and timestamp
    const updateResult = await pool.query(
      "UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING updated_at",
      [hashedPassword, req.user.id]
    );

    const updatedAt = updateResult.rows[0].updated_at;
    console.log('🔐 Password updated for user ID:', req.user.id, 'New timestamp:', updatedAt);

    res.json({
      success: true,
      message: "Password updated successfully",
      passwordUpdatedAt: updatedAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required to delete account" });
    }

    // Get user with password
    const user = await pool.query(
      "SELECT id, password FROM users WHERE id = $1",
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Delete user (CASCADE will delete related data)
    await pool.query("DELETE FROM users WHERE id = $1", [req.user.id]);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Deactivate user account
exports.deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required to deactivate account" });
    }

    // Get user with password
    const user = await pool.query(
      "SELECT id, password FROM users WHERE id = $1",
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Deactivate user (set is_active to false)
    await pool.query(
      "UPDATE users SET is_active = $1 WHERE id = $2",
      [false, req.user.id]
    );

    res.json({ message: "Account deactivated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
