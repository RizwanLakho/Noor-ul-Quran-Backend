const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const {
  getAllUsers,
  deleteUserByAdmin,
  updateUserStatus
} = require('../controllers/adminUsersController');

// Get all users (with pagination and search)
router.get('/users', adminAuthMiddleware, getAllUsers);

// Delete user by ID
router.delete('/users/:userId', adminAuthMiddleware, deleteUserByAdmin);

// Update user status (activate/deactivate)
router.put('/users/:userId/status', adminAuthMiddleware, updateUserStatus);

module.exports = router;
