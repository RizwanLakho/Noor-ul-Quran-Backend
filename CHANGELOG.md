# Changelog

## [Version 2.0.0] - 2025-12-17

### 🎉 Major Release - Complete Database Schema Fix

This release includes comprehensive fixes to all database schema mismatches, complete testing, and full documentation.

### ✨ Features Added
- ✅ Complete superuser and admin role system working
- ✅ Platform statistics endpoint for admin dashboard
- ✅ User analytics endpoints
- ✅ Enhanced error handling across all controllers
- ✅ Comprehensive API testing script included

### 🐛 Bug Fixes

#### Authentication & Authorization
- **Fixed**: Role retrieval in login - Added proper JOIN to roles table
- **Fixed**: Auth middleware now correctly fetches user role from roles table
- **Fixed**: Admin auth middleware properly validates superuser/admin roles

#### User Management
- **Fixed**: `username` column references (changed to CONCAT of first_name, last_name)
- **Fixed**: `password_updated_at` to `updated_at` mapping
- **Fixed**: `status` column to `is_active` boolean
- **Fixed**: `user_ayah_bookmarks` table name to `user_bookmarks`

#### Topics System
- **Fixed**: INSERT VALUES mismatch in topic_ayahs (had 6 placeholders for 5 columns)
- **Fixed**: Route ordering issue causing categories endpoint to fail
- **Fixed**: Topic creation and update operations
- **Fixed**: Bookmark system queries

#### Quiz System
- **Fixed**: Username display in quiz attempts and analytics
- **Fixed**: All quiz admin endpoints now functional

#### Database
- **Added**: All missing database migration scripts
- **Fixed**: Table relationships and foreign keys
- **Populated**: Sample topics and quizzes for testing

### 📝 Files Modified

#### Controllers
- `controllers/authController.js` - Role JOIN in login
- `controllers/quizAdminController.js` - Username references (3 locations)
- `controllers/userStatsController.js` - Table name fix
- `controllers/topicsController.js` - INSERT VALUES fix
- `controllers/adminUsersController.js` - Role and status fixes
- `controllers/usersController.js` - Multiple schema fixes
- `controllers/userController.js` - Column name fixes

#### Middleware
- `middleware/authMiddleware.js` - Role fetch fix
- `middleware/adminAuthMiddleware.js` - Role validation fix
- `middleware/optionalAuthMiddleware.js` - Role fetch for optional auth

#### Routes
- `routes/topicsRoutes.js` - Fixed route ordering (specific before dynamic)
- `routes/adminUsersRoutes.js` - Added stats and analytics endpoints

### 🧪 Testing
- ✅ All authentication endpoints tested and working
- ✅ All admin endpoints tested and working
- ✅ All user profile endpoints tested and working
- ✅ All topics endpoints tested and working
- ✅ All quiz endpoints tested and working
- ✅ Frontend API compatibility verified

### 📚 Documentation
- Added comprehensive `DEPLOYMENT.md` with:
  - Complete deployment guide for VPS
  - All test account credentials
  - API endpoint documentation
  - Troubleshooting guide
  - Security checklist
- Added `test-api.sh` - Automated API testing script
- Added this `CHANGELOG.md`

### 🚀 Deployment

#### Quick Deploy
```bash
git pull origin main
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

See `DEPLOYMENT.md` for complete deployment instructions.

### 🔐 Test Accounts

#### Superuser
- Email: superadmin@quran.com
- Password: SuperAdmin@123
- Role: superuser

#### Admin
- Email: admin@quran.com
- Password: Admin@123
- Role: admin

### ⚠️ Breaking Changes
None - All changes are backward compatible

### 🔜 Next Release Plans
- [ ] Add more quiz categories
- [ ] Implement daily goals tracking
- [ ] Add email verification system
- [ ] Enhance user analytics dashboard
- [ ] Add export functionality for reports

---

## [Version 1.0.0] - 2024-10-27

Initial release with basic functionality.
