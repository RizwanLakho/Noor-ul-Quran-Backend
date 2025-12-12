// Remove Arabic diacritics for better search
exports.removeDiacritics = (text) => {
  if (!text) return '';
  
  // Arabic diacritics Unicode ranges
  const diacriticsRegex = /[\u064B-\u065F\u0670]/g;
  
  return text.replace(diacriticsRegex, '').trim();
};

// Normalize Arabic text for searching
exports.normalizeArabic = (text) => {
  if (!text) return '';
  
  let normalized = text;
  
  // Remove diacritics
  normalized = this.removeDiacritics(normalized);
  
  // Normalize Alef forms: أ إ آ ٱ → ا
  normalized = normalized.replace(/[أإآٱ]/g, 'ا');
  
  // Normalize Taa Marboota: ة → ه
  normalized = normalized.replace(/ة/g, 'ه');
  
  // Normalize Yaa: ى → ي
  normalized = normalized.replace(/ى/g, 'ي');
  
  return normalized.trim();
};
