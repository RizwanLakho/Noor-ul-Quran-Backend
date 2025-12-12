const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translationController');
const authenticateToken = require('../middleware/authMiddleware');
const checkSuperuser = require('../middleware/checkSuperuser');

// Public routes
router.get('/ayah/:surah/:ayah', translationController.getAyahWithTranslation);
router.get('/surah/:surah', translationController.getSurahWithTranslation);
router.get('/list', translationController.getTranslatorsList);

// Protected routes (Superuser only)
router.post('/', 
  authenticateToken, 
  checkSuperuser, 
  translationController.addTranslation
);

router.put('/:id', 
  authenticateToken, 
  checkSuperuser, 
  translationController.updateTranslation
);

router.delete('/:id', 
  authenticateToken, 
  checkSuperuser, 
  translationController.deleteTranslation
);

module.exports = router;
