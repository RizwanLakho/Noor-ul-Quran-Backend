# Quran Backend - Deployment Guide

## Overview
Complete deployment documentation for the Quran Backend API with all fixes applied and tested.

## What Has Been Fixed

### Database Schema Fixes
All controller files have been updated to match the actual database schema:

1. **Role System** - Fixed in all files
   - Changed: Direct `role` column access
   - To: `LEFT JOIN roles r ON u.role_id = r.id` and select `r.role_name as role`
   - Files: authController.js, all middleware files, adminUsersController.js, usersController.js

2. **User Table Columns**
   - `username` → `CONCAT(first_name, ' ', last_name) as username`
   - `password_updated_at` → `updated_at`
   - `status` → `is_active` (boolean)
   - `user_ayah_bookmarks` table → `user_bookmarks` table

3. **Topics System**
   - Fixed INSERT VALUES mismatch in topicsController.js
   - Fixed route order in topicsRoutes.js (specific routes before dynamic :id)
   - All endpoints now working correctly

4. **Admin Routes**
   - Added platform stats endpoint
   - Added user analytics endpoints
   - All admin functionality working

## Test Accounts Created

### Superuser
- **Email**: superadmin@quran.com
- **Password**: SuperAdmin@123
- **Role**: superuser
- **Permissions**: Full system access

### Admin Users
1. **Email**: admin@quran.com
   - **Password**: Admin@123
   - **Role**: admin

2. **Email**: testadmin@quran.com
   - **Password**: TestAdmin@123
   - **Role**: admin

## API Endpoints Verified

### Authentication
- ✅ POST `/api/auth/register` - User registration
- ✅ POST `/api/auth/login` - User login (returns role correctly)

### User Management (Admin)
- ✅ GET `/api/admin/users` - Get all users with pagination
- ✅ GET `/api/admin/users/stats` - Platform statistics
- ✅ GET `/api/admin/users/:userId/analytics` - User analytics
- ✅ GET `/api/admin/users/:userId/quizzes` - User quiz performance
- ✅ GET `/api/admin/users/:userId/topics` - User topic progress
- ✅ DELETE `/api/admin/users/:userId` - Delete user
- ✅ PUT `/api/admin/users/:userId/status` - Update user status

### User Profile
- ✅ GET `/api/users/me/profile` - Get user profile
- ✅ PUT `/api/users/me/profile` - Update profile
- ✅ PUT `/api/users/me/email` - Update email
- ✅ PUT `/api/users/me/password` - Update password
- ✅ DELETE `/api/users/me/account` - Delete account
- ✅ PUT `/api/users/me/deactivate` - Deactivate account

### Topics
- ✅ GET `/api/topics` - Get all topics
- ✅ GET `/api/topics/:id` - Get topic by ID
- ✅ GET `/api/topics/meta/categories` - Get categories
- ✅ GET `/api/topics/meta/popular` - Get popular topics
- ✅ POST `/api/topics` - Create topic (superuser only)
- ✅ PUT `/api/topics/:id` - Update topic (superuser only)
- ✅ DELETE `/api/topics/:id` - Delete topic (superuser only)
- ✅ POST `/api/topics/:id/bookmark` - Bookmark topic

### Quizzes
- ✅ GET `/api/quizzes` - Get all quizzes
- ✅ GET `/api/quizzes/:id` - Get quiz by ID
- ✅ POST `/api/quizzes` - Create quiz (admin only)
- ✅ PUT `/api/quizzes/:id` - Update quiz (admin only)
- ✅ DELETE `/api/quizzes/:id` - Delete quiz (admin only)

### Quran Data
- ✅ GET `/api/quran/surahs` - Get all surahs
- ✅ GET `/api/quran/ayah/:surah/:ayah` - Get specific ayah
- ✅ GET `/api/quran/stats` - Quran statistics

### Translations
- ✅ GET `/api/translations` - Get all translations
- ✅ GET `/api/translations/languages` - Get available languages
- ✅ POST `/api/translations/upload` - Upload translation
- ✅ DELETE `/api/translations/:translator/:language` - Delete translation

## Database Tables

All tables created and populated:
- ✅ users, roles
- ✅ surahs, quran_text, quran_translation
- ✅ topics, topic_ayahs, topic_hadith
- ✅ quizzes, quiz_questions, quiz_question_options
- ✅ user_quiz_attempts, user_quiz_answers
- ✅ user_bookmarks, user_topic_progress
- ✅ juz, hizb_quarters, manzils, rukus, pages, sajdas

## Sample Data Loaded

### Topics
1. "Patience in Islam" - spirituality category
2. "Importance of Prayer" - worship category

### Quizzes
1. "Tawheed Quiz" - aqeedah, easy, 5 questions
2. "Salah (Prayer) Quiz" - fiqh, medium, 4 questions

## Docker Configuration

### Services Running
- **Backend**: Node.js Express app (Port 5000)
- **Database**: PostgreSQL 16 (Port 5432)
- **Redis**: Cache service (Port 6379)
- **Adminer**: Database admin UI (Port 8080)

### Environment Variables
Located in `.env.docker`:
```env
NODE_ENV=production
PORT=5000
DB_HOST=postgres
DB_USER=myapp_user
DB_PASSWORD=myapp_password
DB_NAME=myapp_db
JWT_SECRET=your_jwt_secret_change_in_production
```

## Deployment Steps for VPS

### Method 1: Using Git (Recommended)

1. **On your VPS, pull the latest code:**
```bash
cd /path/to/quran-backend
git pull origin main
```

2. **Rebuild and restart containers:**
```bash
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

3. **Run database migrations (if not already done):**
```bash
docker exec -i quran-app-db psql -U myapp_user -d myapp_db < database/07_quran_postgres.sql
docker exec -i quran-app-db psql -U myapp_user -d myapp_db < database/08_quran_translation.sql
docker exec -i quran-app-db psql -U myapp_user -d myapp_db < database/10_topics_system.sql
docker exec -i quran-app-db psql -U myapp_user -d myapp_db < database/11_quiz_system.sql
docker exec -i quran-app-db psql -U myapp_user -d myapp_db < database/12_fix_quiz_schema.sql
docker exec -i quran-app-db psql -U myapp_user -d myapp_db < database/13_user_topic_progress_schema.sql
docker exec -i quran-app-db psql -U myapp_user -d myapp_db < database/14_setup_user_analytics.sql
docker exec -i quran-app-db psql -U myapp_user -d myapp_db < database/15_quran_metadata_data.sql
```

4. **Create superuser account:**
```bash
# Register via API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Super","lastName":"Admin","email":"superadmin@yourdomain.com","password":"YourSecurePassword@123"}'

# Update role to superuser
docker exec quran-app-db psql -U myapp_user -d myapp_db -c "UPDATE users SET role_id = 1, email_verified = true WHERE email = 'superadmin@yourdomain.com';"
```

5. **Verify deployment:**
```bash
# Check health
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@yourdomain.com","password":"YourSecurePassword@123"}'
```

### Method 2: Manual File Copy

If you don't have git on VPS:

1. **Create a deployment package:**
```bash
cd /home/rizwan/Downloads
tar -czf quran-backend-deploy.tar.gz quran-backend-main/
```

2. **Upload to VPS:**
```bash
scp quran-backend-deploy.tar.gz user@your-vps:/path/to/destination/
```

3. **On VPS, extract and deploy:**
```bash
cd /path/to/destination
tar -xzf quran-backend-deploy.tar.gz
cd quran-backend-main
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

## Testing the Deployment

Run the included test script:
```bash
bash test-api.sh
```

Expected output: All 6 tests should pass with HTTP 200 responses.

## Monitoring

### Check Container Status
```bash
docker ps
docker logs quran-app-backend
docker logs quran-app-db
```

### Database Access
```bash
# Via Docker
docker exec -it quran-app-db psql -U myapp_user -d myapp_db

# Via Adminer (Web UI)
http://your-server:8080
Server: postgres
Username: myapp_user
Password: myapp_password
Database: myapp_db
```

### View Logs
```bash
docker logs -f quran-app-backend
```

## Security Notes

### Production Checklist
- [ ] Change JWT_SECRET to strong random string
- [ ] Change DB_PASSWORD to secure password
- [ ] Update superuser password
- [ ] Configure firewall (UFW/iptables)
- [ ] Set up SSL/TLS with Nginx reverse proxy
- [ ] Configure proper CORS origins
- [ ] Set up regular database backups
- [ ] Enable rate limiting
- [ ] Set up monitoring (PM2, New Relic, etc.)

## Troubleshooting

### Container won't start
```bash
docker logs quran-app-backend
docker exec -it quran-app-backend sh
```

### Database connection errors
```bash
docker exec quran-app-db psql -U myapp_user -d myapp_db -c "SELECT version();"
```

### Port conflicts
```bash
sudo lsof -i :5000
sudo lsof -i :5432
```

### Reset everything
```bash
docker compose down -v  # WARNING: Deletes all data
docker compose up -d
# Re-run migrations
```

## Support

For issues, check:
1. Docker logs: `docker logs quran-app-backend`
2. Database logs: `docker logs quran-app-db`
3. Test script: `bash test-api.sh`

## Files Modified in This Release

- controllers/authController.js
- controllers/quizAdminController.js
- controllers/userStatsController.js
- controllers/topicsController.js
- controllers/adminUsersController.js
- controllers/usersController.js
- controllers/userController.js
- middleware/authMiddleware.js
- middleware/adminAuthMiddleware.js
- middleware/optionalAuthMiddleware.js
- routes/topicsRoutes.js
- routes/adminUsersRoutes.js

All changes are backward compatible with the frontend.
