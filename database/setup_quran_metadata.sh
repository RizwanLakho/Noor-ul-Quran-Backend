#!/bin/bash

# Quran Metadata Setup Script
# This script creates tables and populates Quran metadata

set -e  # Exit on error

echo "🚀 Quran Metadata Setup Script"
echo "================================"
echo ""

# Database credentials from .env
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-myapp_user}"
DB_PASSWORD="${DB_PASSWORD:-123456}"
DB_NAME="${DB_NAME:-myapp_db}"
DB_PORT="${DB_PORT:-5432}"

echo "📊 Database: $DB_NAME"
echo "👤 User: $DB_USER"
echo "🏠 Host: $DB_HOST:$DB_PORT"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Function to execute SQL file
execute_sql() {
    local file=$1
    local description=$2

    echo "📝 $description..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$file" -q

    if [ $? -eq 0 ]; then
        echo "✅ $description completed"
    else
        echo "❌ Error: $description failed"
        exit 1
    fi
    echo ""
}

# Navigate to database directory
cd "$(dirname "$0")"

echo "Step 1/2: Creating metadata tables..."
echo "--------------------------------------"
execute_sql "quran_metadata_schema.sql" "Creating tables (hizb_quarters, manzils, rukus, pages, sajdas)"

echo "Step 2/2: Populating metadata..."
echo "--------------------------------------"
execute_sql "quran_metadata_data.sql" "Inserting 1424 records"

# Verify data
echo "🔍 Verifying data..."
echo "--------------------------------------"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
SELECT
    'Hizb Quarters' as table_name, COUNT(*) as records FROM hizb_quarters
UNION ALL
SELECT 'Manzils', COUNT(*) FROM manzils
UNION ALL
SELECT 'Rukus', COUNT(*) FROM rukus
UNION ALL
SELECT 'Pages', COUNT(*) FROM pages
UNION ALL
SELECT 'Sajdas', COUNT(*) FROM sajdas;
EOF

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📚 Available API endpoints:"
echo "  - GET /api/quran/hizb-quarters"
echo "  - GET /api/quran/manzils"
echo "  - GET /api/quran/rukus"
echo "  - GET /api/quran/pages"
echo "  - GET /api/quran/sajdas"
echo "  - GET /api/quran/metadata/stats"
echo ""
echo "🎉 You can now start using the Quran metadata API!"
