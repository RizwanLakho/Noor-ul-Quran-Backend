#!/bin/bash

# Login first
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"myofficeid192@gmail.com","password":"secret"}')

echo "Login response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "Token: ${TOKEN:0:20}..."

# Get reading goals
echo -e "\n\nGetting reading goals..."
curl -s -X GET http://localhost:5000/api/reading-goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
