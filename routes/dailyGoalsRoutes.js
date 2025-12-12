const express = require('express');
const router = express.Router();
const {
  getDailyGoals,
  createGoal,
  updateGoalProgress,
  deleteGoal,
  archiveExpiredGoals,
} = require('../controllers/dailyGoalsController');
const authenticateToken = require('../middleware/authMiddleware');

// All routes require authentication
router.get('/daily', authenticateToken, getDailyGoals);
router.post('/', authenticateToken, createGoal);
router.put('/:id', authenticateToken, updateGoalProgress);
router.delete('/:id', authenticateToken, deleteGoal);
router.post('/archive-expired', authenticateToken, archiveExpiredGoals);

module.exports = router;
