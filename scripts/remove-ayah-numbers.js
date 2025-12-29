const fs = require('fs');
const path = require('path');

// Arabic numerals to remove (ayah ending markers)
const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

// Read word-by-word.json
const wordByWordPath = path.join(__dirname, '../database/word-by-word.json');
console.log('📖 Reading word-by-word.json...');
const wordByWordData = JSON.parse(fs.readFileSync(wordByWordPath, 'utf8'));

// Filter out ayah number entries
const filteredData = {};
let removedCount = 0;

Object.keys(wordByWordData).forEach(key => {
  const entry = wordByWordData[key];
  const text = entry.text;

  // Check if the text is ONLY Arabic numerals (ayah numbers)
  const isAyahNumber = arabicNumerals.some(num => text === num || text.split('').every(char => arabicNumerals.includes(char)));

  if (isAyahNumber) {
    console.log(`❌ Removing ayah number: ${key} - "${text}"`);
    removedCount++;
  } else {
    filteredData[key] = entry;
  }
});

console.log(`\n✅ Removed ${removedCount} ayah number entries`);
console.log(`📊 Remaining entries: ${Object.keys(filteredData).length}`);

// Save filtered data
console.log('\n💾 Saving cleaned data to word-by-word.json...');
fs.writeFileSync(
  wordByWordPath,
  JSON.stringify(filteredData),
  'utf8'
);

console.log('✅ Successfully cleaned word-by-word.json!');
console.log('\n📝 Next steps:');
console.log('1. Update database with this cleaned data');
console.log('2. Restart backend server');
