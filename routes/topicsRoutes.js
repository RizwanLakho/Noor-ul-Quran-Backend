const express = require("express");
const router = express.Router();
const topicsController = require("../controllers/topicsController");
const authenticateToken = require("../middleware/authMiddleware");
const checkSuperuser = require("../middleware/checkSuperuser");

// PUBLIC ROUTES
router.get(
  "/",
  (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (authHeader) {
      authenticateToken(req, res, next);
    } else {
      next();
    }
  },
  topicsController.getAllTopics,
);

// Specific routes MUST come BEFORE dynamic :id route
router.get("/meta/categories", topicsController.getCategories);
router.get("/meta/popular", topicsController.getPopularTopics);

router.get(
  "/:id",
  (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (authHeader) {
      authenticateToken(req, res, next);
    } else {
      next();
    }
  },
  topicsController.getTopicById,
);

// ADMIN ROUTES (Superuser only)
router.post(
  "/",
  authenticateToken,
  checkSuperuser,
  topicsController.createTopic,
);

router.put(
  "/:id",
  authenticateToken,
  checkSuperuser,
  topicsController.updateTopic,
);

router.delete(
  "/:id",
  authenticateToken,
  checkSuperuser,
  topicsController.deleteTopic,
);

// USER ROUTES (Authenticated)
router.post("/:id/bookmark", authenticateToken, topicsController.bookmarkTopic);

// Enhanced Progress Tracking Routes
const topicProgressController = require("../controllers/topicProgressController");

router.get(
  "/:topicId/progress",
  authenticateToken,
  topicProgressController.getTopicProgress,
);
router.post(
  "/:topicId/progress",
  authenticateToken,
  topicProgressController.saveTopicProgress,
);
router.get(
  "/progress/all",
  authenticateToken,
  topicProgressController.getAllTopicsProgress,
);
router.delete(
  "/:topicId/progress",
  authenticateToken,
  topicProgressController.deleteTopicProgress,
);
router.post(
  "/:topicId/ayah-read",
  authenticateToken,
  topicProgressController.markAyahAsRead,
);

module.exports = router;
