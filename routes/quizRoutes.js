const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authenticateToken = require('../middleware/authMiddleware');

// PUBLIC/USER ROUTES

// Get all quizzes (optional auth)
router.get('/', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    authenticateToken(req, res, next);
  } else {
    next();
  }
}, quizController.getAllQuizzes);

// Get single quiz details
router.get('/:id', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    authenticateToken(req, res, next);
  } else {
    next();
  }
}, quizController.getQuizById);

// Get categories
router.get('/meta/categories', quizController.getCategories);

// AUTHENTICATED ROUTES

// Start quiz
router.get('/:id/start', authenticateToken, quizController.startQuiz);

// Submit quiz
router.post('/:id/submit', authenticateToken, quizController.submitQuiz);

// Get my attempts
router.get('/my/attempts', authenticateToken, quizController.getMyAttempts);

// Get single attempt result
router.get('/attempts/:attemptId', authenticateToken, quizController.getAttemptResult);

// Review quiz (READ-ONLY)
router.get('/attempts/:attemptId/review', authenticateToken, quizController.reviewQuiz);

module.exports = router;
