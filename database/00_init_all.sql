-- =====================================================
-- Master Database Initialization Script
-- This file runs all migrations in the correct order
-- =====================================================

\echo '🚀 Starting database initialization...'

-- Step 1: Create basic schema (users, posts)
\echo '📝 Creating basic schema...'
\i /docker-entrypoint-initdb.d/schema.sql

-- Step 2: Create authentication extensions
\echo '🔐 Setting up authentication system...'
\i /docker-entrypoint-initdb.d/auth_migration.sql

-- Step 3: Create roles and permissions
\echo '👥 Setting up roles and permissions...'
\i /docker-entrypoint-initdb.d/init.sql

-- Step 4: Create base Quran schema (surahs and ayahs tables)
\echo '📖 Creating base Quran schema (surahs and ayahs)...'
\i /docker-entrypoint-initdb.d/01_quran_base_schema.sql

-- Step 5: Load Surah names and metadata
\echo '📚 Loading Surah names...'
\i /docker-entrypoint-initdb.d/surah_names.sql

-- Step 6: Load Quran text data (populates quran_text and ayahs)
\echo '📖 Loading Quran verses...'
\i /docker-entrypoint-initdb.d/quran_postgres.sql

-- Step 7: Create Quran metadata schema (depends on surahs table)
\echo '📖 Creating Quran metadata schema...'
\i /docker-entrypoint-initdb.d/quran_metadata_schema.sql

-- Step 8: Insert Quran metadata data
\echo '📚 Loading Quran metadata...'
\i /docker-entrypoint-initdb.d/quran_metadata_data.sql

-- Step 9: Create Juz schema
\echo '📑 Creating Juz schema...'
\i /docker-entrypoint-initdb.d/juz_schema.sql

-- Step 10: Load translations
\echo '🌍 Loading translations...'
\i /docker-entrypoint-initdb.d/quran_translation.sql

-- Step 11: Setup topics system
\echo '📚 Setting up topics system...'
\i /docker-entrypoint-initdb.d/topics_system.sql

-- Step 12: Setup quiz system
\echo '❓ Setting up quiz system...'
\i /docker-entrypoint-initdb.d/quiz_system.sql

-- Step 13: Setup user analytics
\echo '📊 Setting up user analytics...'
\i /docker-entrypoint-initdb.d/setup_user_analytics.sql

-- Step 14: Add user topic progress tracking
\echo '📈 Setting up progress tracking...'
\i /docker-entrypoint-initdb.d/user_topic_progress_schema.sql

\echo '✅ Database initialization completed successfully!'
\echo '📊 All tables, schemas, and data loaded!'
