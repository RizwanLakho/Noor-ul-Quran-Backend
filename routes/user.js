const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteAccount,
  deactivateAccount
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// Get user profile
router.get("/profile", authMiddleware, getProfile);

// Update user profile (first_name, last_name)
router.put("/profile", authMiddleware, updateProfile);

// Update user email
router.put("/email", authMiddleware, updateEmail);

// Update user password
router.put("/password", authMiddleware, updatePassword);

// Delete user account
router.delete("/account", authMiddleware, deleteAccount);

// Deactivate user account
router.put("/deactivate", authMiddleware, deactivateAccount);

module.exports = router;
