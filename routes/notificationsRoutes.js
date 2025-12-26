const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
} = require('../controllers/notificationsController');
const authenticateToken = require('../middleware/authMiddleware');

// All routes require authentication
router.get('/', authenticateToken, getNotifications);
router.put('/read-all', authenticateToken, markAllAsRead);
router.put('/:id/read', authenticateToken, markAsRead);
router.delete('/:id', authenticateToken, deleteNotification);
router.post('/create', authenticateToken, createNotification); // For testing

module.exports = router;
