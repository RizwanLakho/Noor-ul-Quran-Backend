#!/usr/bin/env python3
import re
import sys

if len(sys.argv) != 3:
    print("Usage: python3 convert_tanzil_quran.py input.sql output.sql")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

print(f"🔄 Converting Tanzil Quran from MySQL to PostgreSQL...")
print(f"📖 Reading: {input_file}")

with open(output_file, 'w', encoding='utf-8') as out:
    # Write PostgreSQL header with Tanzil copyright
    out.write("""-- Tanzil Quran Text (PostgreSQL Format)
-- Original Source: Tanzil Project (http://tanzil.net)
-- License: Creative Commons Attribution 3.0
-- Converted from MySQL to PostgreSQL format

DROP TABLE IF EXISTS quran_text CASCADE;

CREATE TABLE quran_text (
  index SERIAL PRIMARY KEY,
  sura INTEGER NOT NULL,
  aya INTEGER NOT NULL,
  text TEXT NOT NULL
);

CREATE INDEX idx_quran_text_sura ON quran_text(sura);
CREATE INDEX idx_quran_text_sura_aya ON quran_text(sura, aya);

-- Quran Data (6236 verses, 114 surahs)

""")
    
    insert_count = 0
    in_data_section = False
    
    with open(input_file, 'r', encoding='utf-8') as inp:
        for line in inp:
            # Start reading after "Dumping data" comment
            if 'Dumping data for table' in line:
                in_data_section = True
                continue
            
            # Skip lines until we reach data section
            if not in_data_section:
                continue
            
            # Stop at next table or end
            if line.strip().startswith('--') and 'Table structure' in line:
                break
                
            # Process INSERT statements
            if 'INSERT INTO' in line:
                # Remove MySQL-specific syntax
                line = line.replace('`quran_text`', 'quran_text')
                line = line.replace('`index`', 'index')
                line = line.replace('`sura`', 'sura')
                line = line.replace('`aya`', 'aya')
                line = line.replace('`text`', 'text')
                
                # Remove 'index' from INSERT if present (let SERIAL handle it)
                # Change: INSERT INTO quran_text (index, sura, aya, text) VALUES
                # To: INSERT INTO quran_text (sura, aya, text) VALUES
                line = re.sub(r'INSERT INTO quran_text \([^)]*\)', 
                             'INSERT INTO quran_text (sura, aya, text)', line)
                
                # Remove the index value from VALUES
                # Change: VALUES (1, 1, 1, '...')
                # To: VALUES (1, 1, '...')
                line = re.sub(r'VALUES\s*\(\s*\d+\s*,\s*', 'VALUES (', line)
                
                out.write(line)
                insert_count += 1
                
                if insert_count % 100 == 0:
                    print(f"✅ Processed {insert_count} verses...")

print(f"\n🎉 Conversion complete!")
print(f"📊 Total verses converted: {insert_count}")
print(f"💾 Output file: {output_file}")
print(f"\n📌 Next steps:")
print(f"   1. docker cp {output_file} quran-app-db-dev:/tmp/quran.sql")
print(f"   2. docker exec -it quran-app-db-dev psql -U myapp_user -d myapp_db -f /tmp/quran.sql")
