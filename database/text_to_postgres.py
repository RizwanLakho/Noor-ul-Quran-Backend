#!/usr/bin/env python3
"""
Quran Translation Text to PostgreSQL Converter
Converts plain text translation to PostgreSQL SQL format
Author: Senior Software Engineer
Usage: python3 text_to_postgres.py ahmed.txt
"""

import sys
import os
from datetime import datetime

# Standard Quran structure: [surah_number] = ayah_count
QURAN_STRUCTURE = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109,      # 1-10
    123, 111, 43, 52, 99, 128, 111, 110, 98, 135,       # 11-20
    112, 78, 118, 64, 77, 227, 93, 88, 69, 60,          # 21-30
    34, 30, 73, 54, 45, 83, 182, 88, 75, 85,            # 31-40
    54, 53, 89, 59, 37, 35, 38, 29, 18, 45,             # 41-50
    60, 49, 62, 55, 78, 96, 29, 22, 24, 13,             # 51-60
    14, 11, 11, 18, 12, 12, 30, 52, 52, 44,             # 61-70
    28, 28, 20, 56, 40, 31, 50, 40, 46, 42,             # 71-80
    29, 19, 36, 25, 22, 17, 19, 26, 30, 20,             # 81-90
    15, 21, 11, 8, 8, 19, 5, 8, 8, 11,                  # 91-100
    11, 8, 3, 9, 5, 4, 7, 3, 6, 3,                      # 101-110
    5, 4, 5, 6                                           # 111-114
]

def validate_quran_structure():
    """Validate Quran structure array"""
    if len(QURAN_STRUCTURE) != 114:
        raise ValueError(f"Invalid Quran structure: Expected 114 surahs, got {len(QURAN_STRUCTURE)}")
    
    total_ayahs = sum(QURAN_STRUCTURE)
    if total_ayahs != 6236:
        raise ValueError(f"Invalid total ayahs: Expected 6236, got {total_ayahs}")
    
    return True

def read_text_file(filepath):
    """Read and parse text file"""
    if not os.path.exists(filepath):
        print(f"❌ Error: File '{filepath}' not found")
        return None
    
    print(f"📂 Reading: {filepath}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return None
    
    # Clean lines: strip whitespace and remove empty lines
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if line:  # Only non-empty lines
            cleaned_lines.append(line)
    
    print(f"✅ Read {len(cleaned_lines)} non-empty lines")
    return cleaned_lines

def map_to_quran_structure(lines):
    """Map text lines to Quran (surah, ayah) structure"""
    validate_quran_structure()
    
    total_expected = sum(QURAN_STRUCTURE)
    
    if len(lines) != total_expected:
        print(f"⚠️  Warning: Expected {total_expected} ayahs, found {len(lines)} lines")
        print(f"    This might cause misalignment!")
        response = input("    Continue anyway? (yes/no): ").strip().lower()
        if response not in ['yes', 'y']:
            return None
    
    print("🔄 Mapping lines to Quran structure...")
    
    translations = []
    line_index = 0
    
    for surah_num, ayah_count in enumerate(QURAN_STRUCTURE, start=1):
        for ayah_num in range(1, ayah_count + 1):
            if line_index >= len(lines):
                print(f"❌ Error: Ran out of lines at Surah {surah_num}, Ayah {ayah_num}")
                return None
            
            text = lines[line_index]
            # Escape single quotes for SQL
            text = text.replace("'", "''")
            
            translations.append({
                'sura': surah_num,
                'aya': ayah_num,
                'text': text
            })
            
            line_index += 1
        
        print(f"  ✓ Surah {surah_num:3d}: {ayah_count:3d} ayahs mapped")
    
    print(f"✅ Successfully mapped {len(translations)} translations")
    return translations

def generate_sql(translations, translator='Ahmed Ali', language='en'):
    """Generate PostgreSQL compatible SQL"""
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    sql = f"""-- --------------------------------------------------------------------
-- Quran Translation: {translator}
-- Language: {language}
-- Generated: {timestamp}
-- Total Ayahs: {len(translations)}
-- PostgreSQL Compatible
-- --------------------------------------------------------------------

-- Drop existing table
DROP TABLE IF EXISTS quran_translation;

-- Create translation table
CREATE TABLE quran_translation (
  id SERIAL PRIMARY KEY,
  sura INTEGER NOT NULL,
  aya INTEGER NOT NULL,
  text TEXT NOT NULL,
  translator VARCHAR(100) NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  added_by INTEGER REFERENCES users(id),
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_trans_sura_aya ON quran_translation(sura, aya);
CREATE INDEX idx_trans_translator ON quran_translation(translator);
CREATE INDEX idx_trans_language ON quran_translation(language);

-- Unique constraint
CREATE UNIQUE INDEX idx_unique_translation 
ON quran_translation(sura, aya, translator);

-- Insert translation data
"""
    
    # Insert in batches of 500 for better performance
    batch_size = 500
    total_batches = (len(translations) + batch_size - 1) // batch_size
    
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, len(translations))
        batch = translations[start_idx:end_idx]
        
        sql += f"\n-- Batch {batch_num + 1}/{total_batches} (Rows {start_idx + 1} to {end_idx})\n"
        sql += "INSERT INTO quran_translation (sura, aya, text, translator, language) VALUES\n"
        
        for i, trans in enumerate(batch):
            comma = "," if i < len(batch) - 1 else ";"
            sql += f"({trans['sura']}, {trans['aya']}, '{trans['text']}', '{translator}', '{language}'){comma}\n"
    
    sql += "\n-- End of file\n"
    
    return sql

def main():
    """Main function"""
    print("=" * 70)
    print("  Quran Translation Text to PostgreSQL Converter")
    print("=" * 70)
    print()
    
    # Get input file
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = input("📂 Enter text file path [ahmed.txt]: ").strip()
        if not input_file:
            input_file = "ahmed.txt"
    
    # Get output file
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    else:
        default_output = input_file.rsplit('.', 1)[0] + '_translation.sql'
        output_file = input(f"💾 Output SQL file [{default_output}]: ").strip()
        if not output_file:
            output_file = default_output
    
    # Get translator name
    if len(sys.argv) > 3:
        translator = sys.argv[3]
    else:
        translator = input("👤 Translator name [Ahmed Ali]: ").strip()
        if not translator:
            translator = 'Ahmed Ali'
    
    # Get language
    if len(sys.argv) > 4:
        language = sys.argv[4]
    else:
        language = input("🌐 Language code [en]: ").strip()
        if not language:
            language = 'en'
    
    print()
    print("-" * 70)
    print()
    
    # Step 1: Read text file
    lines = read_text_file(input_file)
    if lines is None:
        sys.exit(1)
    
    print()
    
    # Step 2: Map to Quran structure
    translations = map_to_quran_structure(lines)
    if translations is None:
        sys.exit(1)
    
    print()
    
    # Step 3: Generate SQL
    print("📝 Generating SQL...")
    sql_content = generate_sql(translations, translator, language)
    
    # Step 4: Write output file
    print(f"💾 Writing to: {output_file}")
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(sql_content)
    except Exception as e:
        print(f"❌ Error writing file: {e}")
        sys.exit(1)
    
    print()
    print("=" * 70)
    print("✅ SUCCESS! SQL file generated successfully")
    print("=" * 70)
    print()
    print("📊 Summary:")
    print(f"   Input file:    {input_file}")
    print(f"   Output file:   {output_file}")
    print(f"   Translator:    {translator}")
    print(f"   Language:      {language}")
    print(f"   Total ayahs:   {len(translations)}")
    print()
    print("🚀 Next steps:")
    print(f"   1. docker cp {output_file} quran-app-db-dev:/tmp/")
    print(f"   2. docker exec -it quran-app-db-dev psql -U myapp_user -d myapp_db -f /tmp/{os.path.basename(output_file)}")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
