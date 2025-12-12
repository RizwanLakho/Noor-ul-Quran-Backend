const express = require('express');
const router = express.Router();
const { getUserStats, getUserActivity } = require('../controllers/userStatsController');
const authenticateToken = require('../middleware/authMiddleware');

// All routes require authentication
router.get('/stats', authenticateToken, getUserStats);
router.get('/activity', authenticateToken, getUserActivity);

module.exports = router;
