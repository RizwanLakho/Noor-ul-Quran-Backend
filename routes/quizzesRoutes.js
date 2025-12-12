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

// USER QUIZ ATTEMPT ROUTES (authentication optional - saves to DB if logged in)
router.get('/:id/start', optionalAuth, userQuizController.startQuizAttempt);
router.post('/:id/submit', optionalAuth, userQuizController.submitQuizAttempt);
router.get('/attempts/:attemptId/review', optionalAuth, userQuizController.getQuizAttemptReview);

// USER QUIZ HISTORY (authentication required)
router.get('/user/history', authenticateToken, userQuizController.getUserQuizHistory);

// ADMIN ROUTES (Superuser only)
router.post('/', authenticateToken, checkSuperuser, quizzesController.createQuiz);
router.put('/:id', authenticateToken, checkSuperuser, quizzesController.updateQuiz);
router.delete('/:id', authenticateToken, checkSuperuser, quizzesController.deleteQuiz);

module.exports = router;
