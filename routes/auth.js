const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  googleAuth,
  facebookAuth,
  getCurrentUser
} = require("../controllers/authController");
const { registerValidation, loginValidation, validate } = require("../validators/authValidator");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// PUBLIC ROUTES (No authentication required)
// =====================================================

// Email/Password Authentication
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

// Email Verification
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// Password Reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// OAuth Authentication
router.post("/google", googleAuth);
router.post("/facebook", facebookAuth);

// =====================================================
// PROTECTED ROUTES (Authentication required)
// =====================================================

// Get current user profile
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;
