# Mobile App Backend Setup & Troubleshooting Guide

## ✅ Backend is Now Optimized for Mobile Apps!

The following improvements have been made to ensure your mobile app works perfectly:

### 🔧 What Was Fixed:
1. **Increased Request Timeout**: 30 seconds (was default ~10s)
2. **Server Timeout**: 60 seconds for long-running requests
3. **Payload Size**: Increased to 10MB for large data transfers
4. **Database Connection Pool**: Optimized with 20 max connections
5. **CORS Headers**: Explicitly configured for mobile apps
6. **Connection Timeouts**: Proper handling for slow networks

---

## 📱 Mobile App Configuration

### Required Settings in Your Mobile App:

#### 1. API Base URL
```javascript
// For testing on same WiFi network
const API_BASE_URL = "http://192.168.1.181:5000";

// For localhost (Android emulator)
const API_BASE_URL = "http://10.0.2.2:5000";

// For localhost (iOS simulator)
const API_BASE_URL = "http://localhost:5000";

// For production/deployed server
const API_BASE_URL = "https://your-domain.com";
```

#### 2. Request Timeout Settings
```javascript
// Increase timeout in your HTTP client (axios example)
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds - matches backend
  headers: {
    'Content-Type': 'application/json',
  }
});
```

#### 3. Fetch API Timeout (React Native)
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

try {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: controller.signal
  });
  clearTimeout(timeoutId);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timeout');
  }
}
```

---

## 🔍 Troubleshooting Timeout Errors

### Error: "Request timeout. Please try again."

**Possible Causes & Solutions:**

#### 1. ✅ Wrong API URL
**Problem**: Mobile app can't reach the backend
**Solution**:
```javascript
// Check your network:
// - Are you on the same WiFi network?
// - Is the IP address correct?

// Test the connection first:
curl http://192.168.1.181:5000/api/health

// If that works, use that IP in your app
const API_BASE_URL = "http://192.168.1.181:5000";
```

#### 2. ✅ Firewall Blocking Connections
**Problem**: System firewall blocks port 5000
**Solution**:
```bash
# Linux - Allow port 5000
sudo ufw allow 5000/tcp

# Check if Docker containers are accessible
docker compose ps
```

#### 3. ✅ Mobile App Timeout Too Low
**Problem**: App timeout < Backend timeout
**Solution**: Set app timeout to at least 30 seconds (see code above)

#### 4. ✅ Slow Network/WiFi
**Problem**: Request takes longer than timeout
**Solution**:
- Connect to stronger WiFi
- Use backend timeout setting increased to 30s (already done ✓)

#### 5. ✅ Database Not Ready
**Problem**: Database query is slow
**Solution**: Database connection pool is now optimized (already done ✓)

---

## 🧪 Testing Your Setup

### Test 1: Check Backend is Running
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"healthy",...}
```

### Test 2: Check from Mobile Network IP
```bash
curl http://192.168.1.181:5000/api/health
# Expected: {"status":"healthy",...}
```

### Test 3: Test Signup Endpoint
```bash
curl -X POST http://192.168.1.181:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@12345","firstName":"Test","lastName":"User"}'

# Expected: {"success":true,"data":{...}}
```

### Test 4: Test from Your Mobile App
```javascript
// In your mobile app console:
fetch('http://192.168.1.181:5000/api/health')
  .then(res => res.json())
  .then(data => console.log('✅ Backend connected:', data))
  .catch(err => console.error('❌ Connection error:', err));
```

---

## 🌐 Network Setup for Mobile Testing

### Option 1: Same WiFi Network (Recommended)
1. Backend runs on: `192.168.1.181:5000`
2. Mobile app connects to: `http://192.168.1.181:5000`
3. Both devices must be on **same WiFi network**

### Option 2: Android Emulator
1. Backend runs on: `localhost:5000`
2. Android emulator connects to: `http://10.0.2.2:5000`
3. `10.0.2.2` is Android emulator's special alias for `localhost`

### Option 3: iOS Simulator
1. Backend runs on: `localhost:5000`
2. iOS simulator connects to: `http://localhost:5000`
3. iOS simulator shares localhost with host machine

### Option 4: Ngrok/Tunnel (For External Access)
```bash
# Install ngrok: https://ngrok.com/
ngrok http 5000

# Use the ngrok URL in your mobile app:
# https://xxxx-xx-xx-xx-xx.ngrok-free.app
```

---

## 📊 All API Endpoints (Tested & Working)

### ✅ Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### ✅ Quran Data
- `GET /api/quran/surahs` - Get all 114 surahs
- `GET /api/quran/surahs/:id` - Get specific surah with ayahs
- `GET /api/quran/surahs/:id/ayahs` - Get ayahs only
- `GET /api/quran/search?q=query` - Search Quran

### ✅ Metadata
- `GET /api/juz` - Get all Juz
- `GET /api/quran/pages` - Get pages
- `GET /api/quran/sajdas` - Get prostration verses

### ✅ Topics & Quizzes
- `GET /api/topics` - Get topics
- `GET /api/quizzes` - Get quizzes
- `POST /api/quizzes/:id/submit` - Submit quiz

### ✅ User Features
- `GET /api/users/me` - Get profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/me/stats` - Get statistics

---

## ⚙️ Backend Server Settings

Current configuration:
- ✅ Request Timeout: **30 seconds**
- ✅ Server Timeout: **60 seconds**
- ✅ Keep-Alive Timeout: **65 seconds**
- ✅ Payload Size Limit: **10 MB**
- ✅ Database Pool: **20 connections**
- ✅ Database Query Timeout: **30 seconds**
- ✅ CORS: **Enabled for all origins**

---

## 🆘 Still Having Issues?

### Check Backend Logs:
```bash
docker compose logs -f backend
```

### Check All Containers:
```bash
docker compose ps
```

### Restart Everything:
```bash
docker compose restart
```

### Full Reset:
```bash
docker compose down -v
docker compose up -d
```

---

## 📝 Quick Reference

| Issue | Solution |
|-------|----------|
| Timeout on signup | Increase mobile app timeout to 30s |
| Can't connect from phone | Check WiFi and use correct IP |
| CORS errors | Already fixed ✓ Backend allows all origins |
| Slow responses | Database optimized ✓ Connection pool configured |
| Connection refused | Check firewall, allow port 5000 |

---

## ✅ Production Deployment Checklist

Before deploying to production:

1. ✅ Change `.env` JWT secrets
2. ✅ Use HTTPS (not HTTP)
3. ✅ Set specific CORS origins (not `*`)
4. ✅ Configure proper database backups
5. ✅ Set up monitoring and logging
6. ✅ Use environment-specific URLs
7. ✅ Enable rate limiting for public APIs

---

**Last Updated**: December 12, 2025
**Backend Version**: Optimized for Mobile Apps
**Tested**: ✅ All endpoints working
