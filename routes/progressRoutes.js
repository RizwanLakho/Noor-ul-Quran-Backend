const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const authenticateToken = require('../middleware/authMiddleware');

// ============================================================
// PROGRESS TRACKING ROUTES (Authenticated users only)
// ============================================================

// Start or continue reading a topic
router.post('/topics/:id/start', 
  authenticateToken, 
  progressController.startTopic
);

// Mark ayah as read
router.post('/topics/:id/ayahs/:ayahId/read', 
  authenticateToken, 
  progressController.markAyahAsRead
);

// Mark hadith as read
router.post('/topics/:id/hadith/:hadithId/read', 
  authenticateToken, 
  progressController.markHadithAsRead
);

// Get progress for specific topic
router.get('/topics/:id', 
  authenticateToken, 
  progressController.getTopicProgress
);

// Update time spent on topic
router.put('/topics/:id/time', 
  authenticateToken, 
  progressController.updateTimeSpent
);

// Get all user's progress
router.get('/user/all', 
  authenticateToken, 
  progressController.getAllUserProgress
);

// Get user statistics
router.get('/user/stats', 
  authenticateToken, 
  progressController.getUserStats
);

module.exports = router;
