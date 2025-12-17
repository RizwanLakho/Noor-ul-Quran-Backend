#!/bin/bash

echo "=========================================="
echo "Quran Backend API Testing Script"
echo "=========================================="
echo ""

# Login and get token
echo "🔐 Logging in as superuser..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@quran.com","password":"SuperAdmin@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Test 1: Get all users (Admin endpoint)
echo "=========================================="
echo "TEST 1: Get All Users (Admin)"
echo "=========================================="
curl -s -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""
echo ""

# Test 2: Get user profile
echo "=========================================="
echo "TEST 2: Get User Profile"
echo "=========================================="
curl -s -X GET http://localhost:5000/api/users/me/profile \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""
echo ""

# Test 3: Get all topics
echo "=========================================="
echo "TEST 3: Get All Topics"
echo "=========================================="
curl -s -X GET http://localhost:5000/api/topics \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""
echo ""

# Test 4: Get platform stats
echo "=========================================="
echo "TEST 4: Get Platform Stats"
echo "=========================================="
curl -s -X GET http://localhost:5000/api/admin/users/stats \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""
echo ""

# Test 5: Get categories
echo "=========================================="
echo "TEST 5: Get Categories"
echo "=========================================="
curl -s -X GET http://localhost:5000/api/topics/meta/categories \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""
echo ""

# Test 6: Get all quizzes
echo "=========================================="
echo "TEST 6: Get All Quizzes"
echo "=========================================="
curl -s -X GET http://localhost:5000/api/quizzes \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""
echo ""

echo "=========================================="
echo "✅ All Tests Completed!"
echo "=========================================="
