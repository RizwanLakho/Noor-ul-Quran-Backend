const express = require('express');
const router = express.Router();
const juzController = require('../controllers/juzController');

// Get all Juz
router.get('/', juzController.getAllJuz);

// Get specific Juz with ayahs
router.get('/:juzNumber', juzController.getJuzById);

// Get Juz with translation
router.get('/:juzNumber/translation', juzController.getJuzWithTranslation);

// Find Juz for specific ayah
router.get('/ayah/:surah/:ayah', juzController.findJuzForAyah);

module.exports = router;
