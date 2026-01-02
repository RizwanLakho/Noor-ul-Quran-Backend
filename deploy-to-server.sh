#!/bin/bash

# ========================================
# Noor-ul-Quran Backend Deployment Script
# ========================================

set -e  # Exit on error

echo "🚀 Starting Noor-ul-Quran Backend Deployment..."
echo ""

# Step 1: Stop existing containers
echo "📦 Step 1: Stopping existing containers..."
docker compose down -v
echo "✅ Containers stopped and volumes removed"
echo ""

# Step 2: Build fresh containers
echo "🔨 Step 2: Building fresh Docker images..."
docker compose build --no-cache
echo "✅ Docker images built"
echo ""

# Step 3: Start database first (to initialize)
echo "🗄️ Step 3: Starting database..."
docker compose up -d postgres redis
sleep 10
echo "✅ Database started"
echo ""

# Step 4: Run database migrations in correct order
echo "📝 Step 4: Running database migrations..."

DB_EXEC="docker compose exec -T postgres psql -U myapp_user -d myapp_db"

# Base setup
echo "   → Creating base schema..."
cat database/01_schema.sql | $DB_EXEC
cat database/02_auth_migration.sql | $DB_EXEC
cat database/04_init.sql | $DB_EXEC

# Quran base schema
echo "   → Creating Quran base schema..."
cat database/01_quran_base_schema.sql | $DB_EXEC
cat database/04a_surah_names.sql | $DB_EXEC

# Quran data
echo "   → Loading Quran text (this may take a minute)..."
cat database/07_quran_postgres.sql | $DB_EXEC

# Metadata
echo "   → Loading metadata..."
cat database/06_quran_metadata_schema.sql | $DB_EXEC
cat database/15_quran_metadata_data.sql | $DB_EXEC
cat database/05_juz_schema.sql | $DB_EXEC

# Translations
echo "   → Loading translations (this may take a minute)..."
cat database/08_quran_translation.sql | $DB_EXEC

# Features
echo "   → Setting up features..."
cat database/10_topics_system.sql | $DB_EXEC
cat database/11_quiz_system.sql | $DB_EXEC
cat database/12_fix_quiz_schema.sql | $DB_EXEC
cat database/13_user_topic_progress_schema.sql | $DB_EXEC
cat database/14_setup_user_analytics.sql | $DB_EXEC

# Recent additions
echo "   → Adding new features..."
cat database/16_add_profile_picture.sql | $DB_EXEC
cat database/08_word_by_word_schema.sql | $DB_EXEC
cat database/fix_topic_progress_updated_at.sql | $DB_EXEC

# Migrations
echo "   → Running migrations..."
cat database/migrations/add_reading_goals.sql | $DB_EXEC
cat database/migrations/add_reading_sessions_tracking.sql | $DB_EXEC
cat database/migrations/add_last_progress_update_to_goals.sql | $DB_EXEC

echo "✅ Database migrations completed"
echo ""

# Step 5: Start all services
echo "🚀 Step 5: Starting all services..."
docker compose up -d
sleep 15
echo "✅ All services started"
echo ""

# Step 6: Import word-by-word data
echo "📚 Step 6: Importing word-by-word Quran data..."
docker compose exec backend node scripts/import-word-by-word.js
docker compose exec backend node scripts/import-word-translations.js
echo "✅ Word-by-word data imported"
echo ""

# Step 7: Verify deployment
echo "🔍 Step 7: Verifying deployment..."
docker compose ps
echo ""

# Step 8: Check backend health
echo "💚 Step 8: Checking backend health..."
sleep 5
docker compose logs backend --tail=30
echo ""

echo "=========================================="
echo "🎉 Deployment completed successfully!"
echo "=========================================="
echo ""
echo "📊 Container Status:"
docker compose ps
echo ""
echo "🌐 Your API is running at: http://localhost:5000"
echo "🔧 Database admin UI: http://localhost:8080"
echo ""
echo "📝 Next steps:"
echo "   1. Test API: curl http://localhost:5000/api/health"
echo "   2. View logs: docker compose logs -f backend"
echo "   3. Create superuser account (see DEPLOYMENT.md)"
echo ""
