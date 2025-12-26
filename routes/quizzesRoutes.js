const express = require('express');
const router = express.Router();
const quizzesController = require('../controllers/quizzesController');
const userQuizController = require('../controllers/userQuizController');
const authenticateToken = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuthMiddleware');
const checkSuperuser = require('../middleware/checkSuperuser');

// PUBLIC ROUTES
router.get('/', quizzesController.getAllQuizzes);
router.get('/:id', quizzesController.getQuizById);

// USER QUIZ ATTEMPT ROUTES (authentication REQUIRED - login mandatory for quizzes)
router.get('/:id/start', authenticateToken, userQuizController.startQuizAttempt);
router.post('/:id/submit', authenticateToken, userQuizController.submitQuizAttempt);
router.get('/attempts/:attemptId/review', authenticateToken, userQuizController.getQuizAttemptReview);

// USER QUIZ HISTORY (authentication required)
router.get('/user/history', authenticateToken, userQuizController.getUserQuizHistory);

// ADMIN ROUTES (Superuser only)
router.post('/', authenticateToken, checkSuperuser, quizzesController.createQuiz);
router.put('/:id', authenticateToken, checkSuperuser, quizzesController.updateQuiz);
router.delete('/:id', authenticateToken, checkSuperuser, quizzesController.deleteQuiz);

module.exports = router;
