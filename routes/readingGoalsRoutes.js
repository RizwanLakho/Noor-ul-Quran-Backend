const express = require('express');
const router = express.Router();
const {
  getReadingGoals,
  createReadingGoal,
  updateReadingGoal,
  deleteReadingGoal,
  markTargetCompleted,
} = require('../controllers/readingGoalsController');
const authenticateToken = require('../middleware/authMiddleware');

// All routes require authentication
router.get('/', authenticateToken, getReadingGoals);
router.post('/', authenticateToken, createReadingGoal);
router.put('/:id', authenticateToken, updateReadingGoal);
router.delete('/:id', authenticateToken, deleteReadingGoal);
router.post('/:id/complete', authenticateToken, markTargetCompleted);

module.exports = router;
