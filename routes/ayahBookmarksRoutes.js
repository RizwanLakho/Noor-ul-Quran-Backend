const express = require('express');
const router = express.Router();
const ayahBookmarksController = require('../controllers/ayahBookmarksController');
const authenticateToken = require('../middleware/authMiddleware');

// ============================================================
// AYAH BOOKMARKS ROUTES (Authenticated users only)
// ============================================================

// Get all user ayah bookmarks
router.get('/',
  authenticateToken,
  ayahBookmarksController.getUserAyahBookmarks
);

// Check if ayah is bookmarked
router.get('/check/:surahNumber/:ayahNumber',
  authenticateToken,
  ayahBookmarksController.isAyahBookmarked
);

// Add ayah bookmark
router.post('/',
  authenticateToken,
  ayahBookmarksController.addAyahBookmark
);

// Remove ayah bookmark
router.delete('/:id',
  authenticateToken,
  ayahBookmarksController.removeAyahBookmark
);

module.exports = router;
