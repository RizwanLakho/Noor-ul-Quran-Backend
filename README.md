# Noor-ul-Quran Backend API

A comprehensive RESTful backend API for Quran applications with complete metadata, verses, translations, user management, analytics, quizzes, and real-time features.

## Features

- **Complete Quran Data**: Surahs, Ayahs, Juz, Hizb, Manzils, Rukus, Pages, Sajdas
- **Multi-language Translations**: Support for multiple translations
- **User Management**: Authentication, profiles, and progress tracking
- **Analytics & Statistics**: User reading progress, daily goals, activity tracking
- **Quiz System**: Interactive quizzes with topics and progress tracking
- **Real-time Features**: Socket.IO integration for live updates
- **Caching**: Redis integration for improved performance
- **Database Management UI**: Adminer for easy database administration
- **RESTful API**: Well-structured endpoints with validation
- **Docker Support**: Complete containerization with Docker Compose
- **Security**: JWT authentication, rate limiting, helmet, CORS

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Real-time**: Socket.IO
- **Authentication**: JWT (Access & Refresh tokens)
- **Containerization**: Docker & Docker Compose
- **Security**: Helmet, CORS, Rate Limiting, bcrypt

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: [Install Docker Compose](https://docs.docker.com/compose/install/)

OR for manual setup:

- **Node.js**: v18 or higher [Download](https://nodejs.org/)
- **PostgreSQL**: v14 or higher [Download](https://www.postgresql.org/)
- **Redis** (optional): v6 or higher [Download](https://redis.io/)

## Quick Start with Docker (Recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/RizwanLakho/Noor-ul-Quran-Backend.git
cd Noor-ul-Quran-Backend
```

### 2. Create Environment File

Create a `.env` file in the root directory (you can copy from `.env.example`):

```bash
cp .env.example .env
```

**IMPORTANT**: Edit `.env` and change the JWT secrets for production:

```env
JWT_SECRET=your_very_strong_secret_key_here
JWT_REFRESH_SECRET=your_very_strong_refresh_secret_here
```

### 3. Start the Application

Run the following command to start all services (PostgreSQL, Redis, Backend, Adminer):

```bash
npm run docker:prod
```

This will:
- Build and start PostgreSQL database
- Build and start Redis cache
- Build and start the backend API
- Build and start Adminer (database management UI)
- Automatically run all database migrations and seed data

### 4. Access the Application

Once started, you can access:

- **API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health
- **Database UI (Adminer)**: http://localhost:8080
  - System: `PostgreSQL`
  - Server: `postgres`
  - Username: `myapp_user`
  - Password: `myapp_password`
  - Database: `myapp_db`

### 5. View Logs

To view backend logs:

```bash
npm run docker:logs
```

To view all services logs:

```bash
docker-compose logs -f
```

### 6. Stop the Application

```bash
npm run docker:prod:down
```

## Manual Setup (Without Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/RizwanLakho/Noor-ul-Quran-Backend.git
cd Noor-ul-Quran-Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup PostgreSQL Database

Create a database and user:

```sql
CREATE DATABASE myapp_db;
CREATE USER myapp_user WITH PASSWORD 'myapp_password';
GRANT ALL PRIVILEGES ON DATABASE myapp_db TO myapp_user;
```

### 4. Create .env File

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_USER=myapp_user
DB_PASSWORD=myapp_password
DB_NAME=myapp_db
DB_PORT=5432

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=90d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Logging
LOG_LEVEL=info
```

### 5. Run Database Migrations

The database will be automatically initialized when you start the server for the first time. All SQL files in the `database/` folder will be executed.

### 6. Start the Server

Development mode with auto-restart:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### User Management

- `GET /api/users/me` - Get user profile
- `PUT /api/users/me` - Update user profile
- `PUT /api/users/me/email` - Update email
- `PUT /api/users/me/password` - Change password
- `DELETE /api/users/me` - Delete account

### Quran Data

- `GET /api/quran/surahs` - Get all surahs
- `GET /api/quran/surahs/:id` - Get surah by ID
- `GET /api/quran/surahs/:id/ayahs` - Get ayahs of a surah
- `GET /api/quran/ayahs/:id` - Get specific ayah
- `GET /api/quran/search?q=query` - Search in Quran

### Quran Metadata

- `GET /api/quran/juz` - Get all Juz
- `GET /api/quran/juz/:number` - Get specific Juz
- `GET /api/quran/hizb-quarters` - Get Hizb quarters
- `GET /api/quran/manzils` - Get Manzils
- `GET /api/quran/rukus` - Get Rukus
- `GET /api/quran/pages` - Get Pages
- `GET /api/quran/sajdas` - Get Sajdas

### Translations

- `GET /api/translations` - Get available translations
- `GET /api/translations/:id` - Get specific translation

### Topics & Quizzes

- `GET /api/topics` - Get all topics
- `GET /api/topics/:id` - Get topic by ID
- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes/:id/submit` - Submit quiz answers

### User Analytics

- `GET /api/user-analytics` - Get user analytics
- `POST /api/user-analytics/track` - Track reading activity
- `GET /api/users/me/stats` - Get user statistics
- `GET /api/users/me/activity` - Get user activity

### Daily Goals

- `GET /api/goals` - Get user goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Admin

- `GET /api/admin/users` - Get all users (Admin only)
- `PUT /api/admin/users/:id` - Update user (Admin only)
- `DELETE /api/admin/users/:id` - Delete user (Admin only)

### Health Check

- `GET /api/health` - API health status
- `GET /` - API information and available routes

## Project Structure

```
quran-backend-main/
├── config/              # Configuration files (database, etc.)
├── controllers/         # Route controllers
├── database/           # Database schemas and migrations
│   ├── init.sql        # Initial database setup
│   ├── quran_metadata_schema.sql
│   ├── quran_metadata_data.sql
│   ├── auth_migration.sql
│   └── ... (other SQL files)
├── middleware/         # Custom middleware (auth, validation, etc.)
├── routes/            # API routes
├── services/          # Business logic services
├── utils/             # Utility functions
├── validators/        # Input validation schemas
├── logs/              # Application logs
├── uploads/           # User uploads
├── server.js          # Main application file
├── package.json       # Node.js dependencies
├── Dockerfile         # Docker configuration
├── docker-compose.yml # Docker Compose configuration
└── .env.example       # Environment variables example
```

## Docker Configuration

### Services

The docker-compose.yml includes the following services:

1. **PostgreSQL** (Port 5432)
   - Database for storing all application data
   - Auto-initialized with all schemas and seed data

2. **Redis** (Port 6380)
   - Cache layer for improved performance
   - Optional but recommended

3. **Backend API** (Port 5000)
   - Node.js Express server
   - Automatically connects to PostgreSQL and Redis

4. **Adminer** (Port 8080)
   - Web-based database management tool
   - Easy database inspection and queries

### Docker Commands

```bash
# Start all services
npm run docker:prod

# Start in development mode
npm run docker:dev

# Stop all services
npm run docker:prod:down

# View logs
npm run docker:logs

# Rebuild containers
docker-compose up --build

# Remove all containers and volumes
docker-compose down -v
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | production |
| PORT | Server port | 5000 |
| DB_HOST | PostgreSQL host | postgres |
| DB_USER | Database user | myapp_user |
| DB_PASSWORD | Database password | myapp_password |
| DB_NAME | Database name | myapp_db |
| DB_PORT | Database port | 5432 |
| REDIS_HOST | Redis host | redis |
| REDIS_PORT | Redis port | 6379 |
| JWT_SECRET | JWT secret key | (change in production) |
| JWT_REFRESH_SECRET | JWT refresh secret | (change in production) |
| JWT_EXPIRES_IN | Access token expiry | 30d |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiry | 90d |

## Testing the API

You can test the API using curl, Postman, or any HTTP client:

```bash
# Check API health
curl http://localhost:5000/api/health

# Get all surahs
curl http://localhost:5000/api/quran/surahs

# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

## Troubleshooting

### Database Connection Issues

If you get database connection errors:

1. Ensure PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify environment variables in `.env` file

### Port Already in Use

If port 5000 is already in use, change it in `.env`:

```env
PORT=3000
```

And update docker-compose.yml accordingly.

### Redis Connection Issues

Redis is optional. If you don't want to use Redis, you can remove it from docker-compose.yml or comment out Redis-related code in the application.

## Development

### Running Tests

```bash
npm test
```

### Code Structure Guidelines

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and database operations
- **Middleware**: Authentication, validation, error handling
- **Routes**: API endpoint definitions
- **Validators**: Input validation using express-validator

## Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevent abuse and DoS attacks
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Request validation on all endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
- Open an issue on GitHub: [Issues](https://github.com/RizwanLakho/Noor-ul-Quran-Backend/issues)
- Contact: mrizwanalilakho@gmail.com

## Acknowledgments

- Quran data sources and references
- Open source community
- Contributors and maintainers

---

Made with by Rizwan Lakho
