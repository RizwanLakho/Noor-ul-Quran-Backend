const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getProfile,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteAccount,
  deactivateAccount,
  uploadProfilePicture
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads/profile-pictures");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "profile-" + req.user.id + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
  },
});

// Get user profile
router.get("/profile", authMiddleware, getProfile);

// Update user profile (first_name, last_name)
router.put("/profile", authMiddleware, updateProfile);

// Upload profile picture
router.post(
  "/profile-picture",
  authMiddleware,
  upload.single("profile_picture"),
  uploadProfilePicture
);

// Update user email
router.put("/email", authMiddleware, updateEmail);

// Update user password
router.put("/password", authMiddleware, updatePassword);

// Delete user account
router.delete("/account", authMiddleware, deleteAccount);

// Deactivate user account
router.put("/deactivate", authMiddleware, deactivateAccount);

module.exports = router;
