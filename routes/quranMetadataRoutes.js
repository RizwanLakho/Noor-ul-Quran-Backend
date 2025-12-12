const express = require('express');
const router = express.Router();
const {
  // Hizb Quarters
  getAllHizbQuarters,
  getHizbQuarterByNumber,
  findHizbQuarterForAyah,

  // Manzils
  getAllManzils,
  getManzilByNumber,

  // Rukus
  getAllRukus,
  getRukuByNumber,
  findRukuForAyah,

  // Pages
  getAllPages,
  getPageByNumber,
  findPageForAyah,

  // Sajdas
  getAllSajdas,
  getSajdaByNumber,

  // Stats
  getMetadataStats
} = require('../controllers/quranMetadataController');

// =====================================================
// HIZB QUARTERS ROUTES
// =====================================================

/**
 * @route   GET /api/quran/hizb-quarters
 * @desc    Get all Hizb Quarters (240 quarters in 60 Hizbs)
 * @access  Public
 */
router.get('/hizb-quarters', getAllHizbQuarters);

/**
 * @route   GET /api/quran/hizb-quarters/:number
 * @desc    Get specific Hizb Quarter by number (1-240)
 * @access  Public
 */
router.get('/hizb-quarters/:number', getHizbQuarterByNumber);

/**
 * @route   GET /api/quran/hizb-quarters/find/:surah/:ayah
 * @desc    Find which Hizb Quarter contains a specific ayah
 * @access  Public
 */
router.get('/hizb-quarters/find/:surah/:ayah', findHizbQuarterForAyah);

// =====================================================
// MANZILS ROUTES
// =====================================================

/**
 * @route   GET /api/quran/manzils
 * @desc    Get all Manzils (7 sections for weekly reading)
 * @access  Public
 */
router.get('/manzils', getAllManzils);

/**
 * @route   GET /api/quran/manzils/:number
 * @desc    Get specific Manzil by number (1-7)
 * @access  Public
 */
router.get('/manzils/:number', getManzilByNumber);

// =====================================================
// RUKUS ROUTES
// =====================================================

/**
 * @route   GET /api/quran/rukus
 * @desc    Get all Rukus (556 sections/paragraphs)
 * @query   ?surah=1  (optional filter by surah)
 * @access  Public
 */
router.get('/rukus', getAllRukus);

/**
 * @route   GET /api/quran/rukus/:number
 * @desc    Get specific Ruku by number (1-556)
 * @access  Public
 */
router.get('/rukus/:number', getRukuByNumber);

/**
 * @route   GET /api/quran/rukus/find/:surah/:ayah
 * @desc    Find which Ruku contains a specific ayah
 * @access  Public
 */
router.get('/rukus/find/:surah/:ayah', findRukuForAyah);

// =====================================================
// PAGES ROUTES
// =====================================================

/**
 * @route   GET /api/quran/pages
 * @desc    Get all Pages (604 pages in Madani Mushaf)
 * @access  Public
 */
router.get('/pages', getAllPages);

/**
 * @route   GET /api/quran/pages/:number
 * @desc    Get specific Page by number (1-604)
 * @access  Public
 */
router.get('/pages/:number', getPageByNumber);

/**
 * @route   GET /api/quran/pages/find/:surah/:ayah
 * @desc    Find which Page contains a specific ayah
 * @access  Public
 */
router.get('/pages/find/:surah/:ayah', findPageForAyah);

// =====================================================
// SAJDAS ROUTES
// =====================================================

/**
 * @route   GET /api/quran/sajdas
 * @desc    Get all Sajdas (15 prostration verses)
 * @query   ?type=recommended  OR  ?type=obligatory
 * @access  Public
 */
router.get('/sajdas', getAllSajdas);

/**
 * @route   GET /api/quran/sajdas/:number
 * @desc    Get specific Sajda by number (1-15)
 * @access  Public
 */
router.get('/sajdas/:number', getSajdaByNumber);

// =====================================================
// METADATA STATS
// =====================================================

/**
 * @route   GET /api/quran/metadata/stats
 * @desc    Get statistics about all Quran metadata
 * @access  Public
 */
router.get('/metadata/stats', getMetadataStats);

module.exports = router;
