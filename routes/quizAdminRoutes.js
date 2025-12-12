const express = require('express');
const router = express.Router();
const quizAdminController = require('../controllers/quizAdminController');
const authenticateToken = require('../middleware/authMiddleware');
const checkSuperuser = require('../middleware/checkSuperuser');

// All admin routes require superuser
router.use(authenticateToken);
router.use(checkSuperuser);

// Quiz management
router.post('/', quizAdminController.createQuiz);
router.put('/:id', quizAdminController.updateQuiz);
router.delete('/:id', quizAdminController.deleteQuiz);

// Question management
router.get('/:id/questions', quizAdminController.getQuizQuestions);
router.post('/:id/questions', quizAdminController.addQuestion);
router.put('/:id/questions/:questionId', quizAdminController.updateQuestion);
router.delete('/:id/questions/:questionId', quizAdminController.deleteQuestion);

// Analytics
router.get('/:id/analytics', quizAdminController.getQuizAnalytics);
router.get('/:id/attempts', quizAdminController.getQuizAttempts);
router.get('/attempts/:attemptId/view', quizAdminController.viewUserAttempt);

module.exports = router;
