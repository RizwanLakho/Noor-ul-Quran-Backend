#!/usr/bin/env node

/**
 * Quran Metadata Seeder
 * Generates SQL INSERT statements from quran-data.js
 */

const fs = require('fs');
const path = require('path');

// Read the quran-data.js file
const quranDataPath = path.join(__dirname, 'quran-data.js');
let quranDataContent = fs.readFileSync(quranDataPath, 'utf-8');

// Convert JavaScript to JSON-parseable format
quranDataContent = quranDataContent
  .replace(/var QuranData = \{\};/g, '')
  .replace(/QuranData\./g, 'exports.');

// Execute the code to get the data
eval(quranDataContent);

// Generate SQL file
let sql = `-- Quran Metadata Data
-- Source: Tanzil.info (Creative Commons Attribution 3.0)
-- Generated: ${new Date().toISOString()}

-- Disable triggers for faster insertion
SET session_replication_role = 'replica';

-- Clear existing data
TRUNCATE TABLE hizb_quarters, manzils, rukus, pages, sajdas RESTART IDENTITY CASCADE;

`;

// ========== HIZB QUARTERS ==========
sql += `\n-- ========== HIZB QUARTERS (240 quarters) ==========\n`;
sql += `INSERT INTO hizb_quarters (hizb_quarter_number, surah_number, ayah_number) VALUES\n`;

const hizbValues = [];
for (let i = 1; i < exports.HizbQaurter.length; i++) {
  const [surah, ayah] = exports.HizbQaurter[i];
  hizbValues.push(`  (${i}, ${surah}, ${ayah})`);
}
sql += hizbValues.join(',\n') + ';\n';

console.log(`✅ Hizb Quarters: ${hizbValues.length} records`);

// ========== MANZILS ==========
sql += `\n-- ========== MANZILS (7 sections) ==========\n`;
sql += `INSERT INTO manzils (manzil_number, surah_number, ayah_number, manzil_name_english) VALUES\n`;

const manzilNames = [
  '', 'First Manzil', 'Second Manzil', 'Third Manzil',
  'Fourth Manzil', 'Fifth Manzil', 'Sixth Manzil', 'Seventh Manzil'
];

const manzilValues = [];
for (let i = 1; i < exports.Manzil.length; i++) {
  const [surah, ayah] = exports.Manzil[i];
  manzilValues.push(`  (${i}, ${surah}, ${ayah}, '${manzilNames[i]}')`);
}
sql += manzilValues.join(',\n') + ';\n';

console.log(`✅ Manzils: ${manzilValues.length} records`);

// ========== RUKUS ==========
sql += `\n-- ========== RUKUS (556 sections) ==========\n`;
sql += `INSERT INTO rukus (ruku_number, surah_number, ayah_number) VALUES\n`;

const rukuValues = [];
for (let i = 1; i < exports.Ruku.length; i++) {
  const [surah, ayah] = exports.Ruku[i];
  rukuValues.push(`  (${i}, ${surah}, ${ayah})`);
}
sql += rukuValues.join(',\n') + ';\n';

console.log(`✅ Rukus: ${rukuValues.length} records`);

// ========== PAGES ==========
sql += `\n-- ========== PAGES (604 pages) ==========\n`;
sql += `INSERT INTO pages (page_number, surah_number, ayah_number) VALUES\n`;

const pageValues = [];
for (let i = 1; i < exports.Page.length; i++) {
  const [surah, ayah] = exports.Page[i];
  pageValues.push(`  (${i}, ${surah}, ${ayah})`);
}
sql += pageValues.join(',\n') + ';\n';

console.log(`✅ Pages: ${pageValues.length} records`);

// ========== SAJDAS ==========
sql += `\n-- ========== SAJDAS (15 prostration verses) ==========\n`;
sql += `INSERT INTO sajdas (sajda_number, surah_number, ayah_number, sajda_type) VALUES\n`;

const sajdaValues = [];
for (let i = 1; i < exports.Sajda.length; i++) {
  const [surah, ayah, type] = exports.Sajda[i];
  sajdaValues.push(`  (${i}, ${surah}, ${ayah}, '${type}')`);
}
sql += sajdaValues.join(',\n') + ';\n';

console.log(`✅ Sajdas: ${sajdaValues.length} records`);

// Re-enable triggers
sql += `\n-- Re-enable triggers\n`;
sql += `SET session_replication_role = 'origin';\n\n`;

// Summary
sql += `-- ========== SUMMARY ==========\n`;
sql += `-- Hizb Quarters: ${hizbValues.length}\n`;
sql += `-- Manzils: ${manzilValues.length}\n`;
sql += `-- Rukus: ${rukuValues.length}\n`;
sql += `-- Pages: ${pageValues.length}\n`;
sql += `-- Sajdas: ${sajdaValues.length}\n`;
sql += `-- Total: ${hizbValues.length + manzilValues.length + rukuValues.length + pageValues.length + sajdaValues.length} records\n`;

// Write SQL file
const outputPath = path.join(__dirname, 'quran_metadata_data.sql');
fs.writeFileSync(outputPath, sql);

console.log(`\n✅ SQL file generated: ${outputPath}`);
console.log(`📊 Total records: ${hizbValues.length + manzilValues.length + rukuValues.length + pageValues.length + sajdaValues.length}`);
