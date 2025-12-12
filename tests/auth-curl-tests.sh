#!/bin/bash

# Authentication API Tests using cURL
# Make this script executable: chmod +x auth-curl-tests.sh

BASE_URL="http://localhost:3000"
CONTENT_TYPE="Content-Type: application/json"

echo "=========================================="
echo "Authentication API Tests"
echo "=========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
test_num=1

# Function to print test header
print_test() {
  echo -e "${YELLOW}Test $test_num: $1${NC}"
  ((test_num++))
}

# Function to print response
print_response() {
  echo -e "${GREEN}Response:${NC}"
  echo "$1" | jq '.' 2>/dev/null || echo "$1"
  echo ""
}

# ============================================
# SIGNUP TESTS
# ============================================

echo "=========================================="
echo "SIGNUP TESTS"
echo "=========================================="
echo ""

print_test "Successful Registration"
response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }')
print_response "$response"

# Save token for later use
TOKEN=$(echo "$response" | jq -r '.token' 2>/dev/null)

print_test "Registration with Missing Fields"
response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "first_name": "Jane",
    "email": "jane@example.com"
  }')
print_response "$response"

print_test "Registration with Invalid Email"
response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "first_name": "Bob",
    "last_name": "Smith",
    "email": "invalid-email",
    "password": "SecurePass123"
  }')
print_response "$response"

print_test "Registration with Weak Password"
response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "alice@example.com",
    "password": "weak"
  }')
print_response "$response"

print_test "Registration with Short Names"
response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "first_name": "A",
    "last_name": "B",
    "email": "ab@example.com",
    "password": "SecurePass123"
  }')
print_response "$response"

print_test "Registration with Special Characters in Name"
response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "first_name": "Mary-Jane",
    "last_name": "O'\''Connor",
    "email": "mary.jane@example.com",
    "password": "SecurePass123"
  }')
print_response "$response"

print_test "Duplicate Email Registration"
response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "first_name": "John",
    "last_name": "Duplicate",
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }')
print_response "$response"

# ============================================
# LOGIN TESTS
# ============================================

echo "=========================================="
echo "LOGIN TESTS"
echo "=========================================="
echo ""

print_test "Successful Login"
response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }')
print_response "$response"

# Update token if login was successful
NEW_TOKEN=$(echo "$response" | jq -r '.token' 2>/dev/null)
if [ "$NEW_TOKEN" != "null" ] && [ -n "$NEW_TOKEN" ]; then
  TOKEN="$NEW_TOKEN"
fi

print_test "Login with Wrong Password"
response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{
    "email": "john.doe@example.com",
    "password": "WrongPassword123"
  }')
print_response "$response"

print_test "Login with Non-existent Email"
response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{
    "email": "notfound@example.com",
    "password": "SecurePass123"
  }')
print_response "$response"

print_test "Login with Missing Password"
response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{
    "email": "john.doe@example.com"
  }')
print_response "$response"

print_test "Login with Invalid Email Format"
response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{
    "email": "invalid-email",
    "password": "SecurePass123"
  }')
print_response "$response"

# ============================================
# AUTHENTICATED ENDPOINT TESTS
# ============================================

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo "=========================================="
  echo "AUTHENTICATED ENDPOINT TESTS"
  echo "=========================================="
  echo ""

  print_test "Access Protected Route with Valid Token"
  response=$(curl -s -X GET "$BASE_URL/api/users/profile" \
    -H "Authorization: Bearer $TOKEN")
  print_response "$response"

  print_test "Access Protected Route without Token"
  response=$(curl -s -X GET "$BASE_URL/api/users/profile")
  print_response "$response"

  print_test "Access Protected Route with Invalid Token"
  response=$(curl -s -X GET "$BASE_URL/api/users/profile" \
    -H "Authorization: Bearer invalid_token_here")
  print_response "$response"

  echo -e "${GREEN}=========================================="
  echo "Saved Token for future use:"
  echo "=========================================="
  echo "$TOKEN"
  echo -e "${NC}"
fi

echo "=========================================="
echo "All tests completed!"
echo "=========================================="
