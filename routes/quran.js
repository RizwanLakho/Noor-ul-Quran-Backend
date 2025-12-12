const express = require("express");
const router = express.Router();
const {
  getAllSurahs,
  getSurahById,
  getAyah,
  searchQuran,
  getRandomAyah,
  getAyahsByRange,
  getStats,
} = require("../controllers/quranController");

// Public routes (no authentication needed)
router.get("/surahs", getAllSurahs);
router.get("/surahs/:id", getSurahById);
router.get("/ayah/:surah/:ayah", getAyah);
router.get("/ayahs/:surah/:from/:to", getAyahsByRange);
router.get("/search", searchQuran);
router.get("/random", getRandomAyah);
router.get("/stats", getStats);

module.exports = router;
