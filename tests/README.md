# Authentication API Tests

This directory contains test files to verify your authentication endpoints are working correctly.

## Test Files

1. **auth.test.http** - For VS Code REST Client extension
2. **auth-curl-tests.sh** - Bash script with cURL commands
3. **auth.postman.json** - Postman collection
4. **README.md** - This file

## Prerequisites

Before running tests, ensure:
- Your server is running (usually on `http://localhost:3000`)
- PostgreSQL database is set up and running
- All dependencies are installed (`npm install`)

## Method 1: VS Code REST Client

1. Install the "REST Client" extension in VS Code
2. Open `auth.test.http`
3. Click "Send Request" above any test
4. View responses inline

## Method 2: cURL Script

```bash
# Make the script executable
chmod +x tests/auth-curl-tests.sh

# Run all tests
./tests/auth-curl-tests.sh
```

**Requirements:**
- `curl` command installed
- `jq` installed for JSON formatting (optional but recommended)
  - Ubuntu/Debian: `sudo apt-get install jq`
  - macOS: `brew install jq`

## Method 3: Postman

1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `auth.postman.json`
4. The collection will be imported with all tests
5. Update the `baseUrl` variable if needed (Collection → Variables)
6. Run individual tests or the entire collection

## Method 4: Manual cURL Commands

### Signup Test
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

### Login Test
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

### Access Protected Route
```bash
# Replace YOUR_TOKEN with the token from login response
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Expected Test Results

### ✅ Successful Registration (Test 1)
**Status:** 201 Created
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "role": "user",
    "created_at": "2025-10-31T..."
  },
  "token": "eyJhbGc..."
}
```

### ❌ Missing Fields (Test 2)
**Status:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "last_name",
      "message": "Last name is required"
    }
  ]
}
```

### ❌ Invalid Email (Test 3)
**Status:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### ❌ Weak Password (Test 4)
**Status:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

### ✅ Successful Login (Test 8)
**Status:** 200 OK
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "role": "user"
  },
  "token": "eyJhbGc..."
}
```

### ❌ Wrong Password (Test 9)
**Status:** 400 Bad Request
```json
{
  "error": "Invalid credentials"
}
```

## Test Coverage

### Signup Tests (7 tests)
- ✅ Successful registration
- ✅ Missing required fields
- ✅ Invalid email format
- ✅ Weak password
- ✅ Short names (< 2 characters)
- ✅ Special characters in names
- ✅ Duplicate email

### Login Tests (5 tests)
- ✅ Successful login
- ✅ Wrong password
- ✅ Non-existent email
- ✅ Missing password
- ✅ Invalid email format

### Protected Route Tests (3 tests)
- ✅ Valid token
- ✅ Missing token
- ✅ Invalid token

## Troubleshooting

### Server not responding
- Check if server is running: `npm start` or `node server.js`
- Verify the port (default: 3000)

### Database errors
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Run migrations if needed

### "User already exists" error
- Clear test users from database or use different emails
- Run: `psql -d your_database -c "DELETE FROM users WHERE email LIKE '%example.com';"`

### Token issues
- Verify JWT_SECRET is set in `.env`
- Check token expiration (default: 30 days)

## Clean Up Test Data

After running tests, you may want to remove test users:

```bash
# Connect to PostgreSQL
psql -U your_username -d your_database

# Delete test users
DELETE FROM users WHERE email LIKE '%example.com';
```

## Notes

- First test (successful registration) will fail if run twice with same email
- Login tests depend on successful registration
- Token is automatically saved and reused in authenticated tests
- All passwords in tests use the secure format: minimum 8 chars, uppercase, lowercase, number
