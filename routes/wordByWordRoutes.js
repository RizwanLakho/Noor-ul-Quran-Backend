const express = require('express');
const router = express.Router();
const wordByWordController = require('../controllers/wordByWordController');

// Get word-by-word statistics
router.get('/stats', wordByWordController.getStats);

// Get word-by-word data for entire surah
router.get('/surah/:surahNumber', wordByWordController.getSurahWords);

// Get word translations for a specific word
router.get('/word/:wordId/translations', wordByWordController.getWordTranslations);

// Get word-by-word data for a specific ayah
router.get('/:surahNumber/:ayahNumber', wordByWordController.getAyahWords);

module.exports = router;
