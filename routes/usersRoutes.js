const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const authenticateToken = require('../middleware/authMiddleware');
const checkSuperuser = require('../middleware/checkSuperuser');

// All routes require authentication and superuser role
router.use(authenticateToken);
router.use(checkSuperuser);

// Get all users with stats
router.get('/', usersController.getAllUsers);

// Get platform statistics
router.get('/stats/platform', usersController.getPlatformStats);

// Get individual user analytics
router.get('/:userId/analytics', usersController.getUserAnalytics);

// Get user quiz performance
router.get('/:userId/quiz-performance', usersController.getUserQuizPerformance);

// Get user topic progress
router.get('/:userId/topic-progress', usersController.getUserTopicProgress);

module.exports = router;
