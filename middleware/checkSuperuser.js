const checkSuperuser = (req, res, next) => {
  try {
    console.log("🔐 Checking superuser:", req.user);

    if (!req.user) {
      return res.status(403).json({
        error: "Authentication required",
      });
    }

    // Check if user is superuser
    if (req.user.role !== "superuser") {
      console.log("❌ User role:", req.user.role, "- Expected: superuser");
      return res.status(403).json({
        error: "Superuser access required",
      });
    }

    console.log("✅ Superuser verified");
    next();
  } catch (err) {
    console.error("Superuser check error:", err);
    return res.status(500).json({
      error: "Server error during authorization",
    });
  }
};

module.exports = checkSuperuser;
