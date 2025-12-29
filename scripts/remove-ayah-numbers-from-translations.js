const fs = require('fs');
const path = require('path');

// Read both files
const wordByWordPath = path.join(__dirname, '../database/word-by-word.json');
const translationPath = path.join(__dirname, '../database/word-by-word-translation.json');

console.log('📖 Reading word-by-word.json to get valid keys...');
const wordByWordData = JSON.parse(fs.readFileSync(wordByWordPath, 'utf8'));
const validKeys = new Set(Object.keys(wordByWordData));

console.log(`✅ Found ${validKeys.size} valid word keys`);

console.log('\n📖 Reading word-by-word-translation.json...');
const translationData = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
const totalTranslations = Object.keys(translationData).length;

console.log(`📊 Total translation entries: ${totalTranslations}`);

// Filter translations to only keep ones that have corresponding words
const filteredTranslations = {};
let removedCount = 0;

Object.keys(translationData).forEach(key => {
  if (validKeys.has(key)) {
    filteredTranslations[key] = translationData[key];
  } else {
    console.log(`❌ Removing orphaned translation: ${key} - "${translationData[key]}"`);
    removedCount++;
  }
});

console.log(`\n✅ Removed ${removedCount} orphaned translation entries`);
console.log(`📊 Remaining translations: ${Object.keys(filteredTranslations).length}`);

// Save filtered translations
console.log('\n💾 Saving cleaned translations to word-by-word-translation.json...');
fs.writeFileSync(
  translationPath,
  JSON.stringify(filteredTranslations),
  'utf8'
);

console.log('✅ Successfully cleaned word-by-word-translation.json!');
console.log('\n📝 Next step: Run import-word-translations.js to update database');
