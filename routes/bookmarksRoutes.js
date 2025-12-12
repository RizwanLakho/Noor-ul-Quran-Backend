const express = require('express');
const router = express.Router();
const bookmarksController = require('../controllers/bookmarksController');
const authenticateToken = require('../middleware/authMiddleware');

// ============================================================
// BOOKMARKS ROUTES (Authenticated users only)
// ============================================================

// Add bookmark
router.post('/:topicId', 
  authenticateToken, 
  bookmarksController.addBookmark
);

// Remove bookmark
router.delete('/:topicId', 
  authenticateToken, 
  bookmarksController.removeBookmark
);

// Get all user bookmarks
router.get('/', 
  authenticateToken, 
  bookmarksController.getUserBookmarks
);

module.exports = router;
