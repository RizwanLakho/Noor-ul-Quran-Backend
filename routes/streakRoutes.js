const express = require('express');
const router = express.Router();
const { updateStreak, getStreak } = require('../controllers/streakController');
const authenticateToken = require('../middleware/authMiddleware');

// All routes require authentication
router.post('/update', authenticateToken, updateStreak);
router.get('/', authenticateToken, getStreak);

module.exports = router;
