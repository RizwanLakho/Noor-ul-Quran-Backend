const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const translationsController = require('../controllers/translationsController');
const authenticateToken = require('../middleware/authMiddleware');
const checkSuperuser = require('../middleware/checkSuperuser');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp/');
  },
  filename: (req, file, cb) => {
    cb(null, `translation-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || path.extname(file.originalname) === '.txt') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// PUBLIC ROUTES
router.get('/', translationsController.getAllTranslations);
router.get('/check', translationsController.checkTranslationExists);
router.get('/languages', translationsController.getLanguages);
router.get('/:translator/:language', translationsController.getTranslationByName);

// ADMIN ROUTES (Superuser only)
router.post(
  '/upload',
  authenticateToken,
  checkSuperuser,
  upload.single('file'),
  translationsController.uploadTranslation
);

router.delete(
  '/:translator/:language',
  authenticateToken,
  checkSuperuser,
  translationsController.deleteTranslation
);

module.exports = router;
