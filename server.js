const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
const pool = require("./config/db");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ⭐ MIDDLEWARE MUST COME FIRST - BEFORE ROUTES! ⭐
// CORS with explicit mobile app support
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase payload size limits for mobile apps
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware - give mobile apps more time
app.use((req, res, next) => {
  // Set timeout to 30 seconds for all requests
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Serve static files for profile pictures
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test database connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Database connected at:", res.rows[0].now);
  }
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Quran API is running!",
    timestamp: new Date().toISOString(),
    routes: [
      '/api/auth',
      '/api/users',
      '/api/quran',
      '/api/quran/hizb-quarters',
      '/api/quran/manzils',
      '/api/quran/rukus',
      '/api/quran/pages',
      '/api/quran/sajdas',
      '/api/topics',
      '/api/quizzes',
      '/api/translations',
      '/api/user-analytics',
      '/api/juz',
      '/api/reading-goals'
    ]
  });
});

// Import and register routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const quranRoutes = require("./routes/quran");
const quranMetadataRoutes = require("./routes/quranMetadataRoutes");
const topicsRoutes = require("./routes/topicsRoutes");
const quizzesRoutes = require("./routes/quizzesRoutes");
const translationsRoutes = require("./routes/translationsRoutes");
const usersAnalyticsRoutes = require('./routes/usersRoutes');
const juzRoutes = require('./routes/juzRoutes');
const userStatsRoutes = require('./routes/userStatsRoutes');
const streakRoutes = require('./routes/streakRoutes');
const dailyGoalsRoutes = require('./routes/dailyGoalsRoutes');
const readingGoalsRoutes = require('./routes/readingGoalsRoutes');
const adminUsersRoutes = require('./routes/adminUsersRoutes');
const ayahBookmarksRoutes = require('./routes/ayahBookmarksRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');

app.use("/api/auth", authRoutes);
app.use("/api/users/me", userRoutes); // Profile, email, password, account routes
app.use("/api/quran", quranRoutes);
app.use("/api/quran", quranMetadataRoutes);
app.use("/api/topics", topicsRoutes);
app.use("/api/quizzes", quizzesRoutes);
app.use("/api/translations", translationsRoutes);
app.use("/api/user-analytics", usersAnalyticsRoutes);
app.use("/api/juz", juzRoutes);
app.use("/api/users/me", userStatsRoutes); // Stats and activity routes
app.use("/api/users/me/streak", streakRoutes); // Streak tracking
app.use("/api/notifications", notificationsRoutes); // Notifications
app.use("/api/goals", dailyGoalsRoutes);
app.use("/api/reading-goals", readingGoalsRoutes); // Reading goals with custom duration
app.use("/api/admin", adminUsersRoutes); // Admin user management
app.use("/api/ayah-bookmarks", ayahBookmarksRoutes); // Ayah bookmarks

// Health check endpoint for Docker
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Socket.IO for real-time features
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Error handling middleware - LAST
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: "Something went wrong!", details: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Set server timeouts for better mobile app compatibility
server.timeout = 60000; // 60 seconds
server.keepAliveTimeout = 65000; // 65 seconds (slightly more than timeout)
server.headersTimeout = 66000; // 66 seconds (slightly more than keepAliveTimeout)

// Initialize notification scheduler
const { initializeScheduler } = require('./services/notificationScheduler');

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Access from mobile: http://192.168.1.181:${PORT}`);
  console.log(`⏱️  Request timeout: 30s | Server timeout: 60s`);

  // Start notification scheduler
  initializeScheduler();
});

module.exports = app;
