const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const {
  getAllUsers,
  deleteUserByAdmin,
  updateUserStatus
} = require('../controllers/adminUsersController');
const {
  getPlatformStats,
  getUserAnalytics,
  getUserQuizPerformance,
  getUserTopicProgress
} = require('../controllers/usersController');

// Get all users (with pagination and search)
router.get('/users', adminAuthMiddleware, getAllUsers);

// Get platform statistics
router.get('/users/stats', adminAuthMiddleware, getPlatformStats);

// Get specific user analytics
router.get('/users/:userId/analytics', adminAuthMiddleware, getUserAnalytics);

// Get user quiz performance
router.get('/users/:userId/quizzes', adminAuthMiddleware, getUserQuizPerformance);

// Get user topic progress
router.get('/users/:userId/topics', adminAuthMiddleware, getUserTopicProgress);

// Delete user by ID
router.delete('/users/:userId', adminAuthMiddleware, deleteUserByAdmin);

// Update user status (activate/deactivate)
router.put('/users/:userId/status', adminAuthMiddleware, updateUserStatus);

module.exports = router;
