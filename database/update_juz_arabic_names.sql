-- =====================================================
-- Update Juz Arabic Names with Proper Quranic Names
-- =====================================================
-- This script updates the juz_name_arabic column with
-- authentic Quranic names based on the opening words
-- of each Juz instead of generic "First Juz", "Second Juz", etc.
-- =====================================================

-- Update all 30 Juz with proper Quranic Arabic names
UPDATE juz SET juz_name_arabic = 'الٓمٓ' WHERE juz_number = 1;
UPDATE juz SET juz_name_arabic = 'سَيَقُولُ' WHERE juz_number = 2;
UPDATE juz SET juz_name_arabic = 'تِلْكَ ٱلرُّسُلُ' WHERE juz_number = 3;
UPDATE juz SET juz_name_arabic = 'لَن تَنَالُوا۟' WHERE juz_number = 4;
UPDATE juz SET juz_name_arabic = 'وَٱلْمُحْصَنَـٰتُ' WHERE juz_number = 5;
UPDATE juz SET juz_name_arabic = 'لَا يُحِبُّ ٱللَّهُ' WHERE juz_number = 6;
UPDATE juz SET juz_name_arabic = 'وَإِذَا سَمِعُوا۟' WHERE juz_number = 7;
UPDATE juz SET juz_name_arabic = 'وَلَوْ أَنَّنَا' WHERE juz_number = 8;
UPDATE juz SET juz_name_arabic = 'قَالَ ٱلْمَلَأُ' WHERE juz_number = 9;
UPDATE juz SET juz_name_arabic = 'وَٱعْلَمُوا۟' WHERE juz_number = 10;
UPDATE juz SET juz_name_arabic = 'يَعْتَذِرُونَ' WHERE juz_number = 11;
UPDATE juz SET juz_name_arabic = 'وَمَا مِنْ دَآبَّةٍ' WHERE juz_number = 12;
UPDATE juz SET juz_name_arabic = 'وَمَا أُبَرِّئُ' WHERE juz_number = 13;
UPDATE juz SET juz_name_arabic = 'رُبَمَا' WHERE juz_number = 14;
UPDATE juz SET juz_name_arabic = 'سُبْحَـٰنَ ٱلَّذِى' WHERE juz_number = 15;
UPDATE juz SET juz_name_arabic = 'قَالَ أَلَمْ' WHERE juz_number = 16;
UPDATE juz SET juz_name_arabic = 'ٱقْتَرَبَ لِلنَّاسِ' WHERE juz_number = 17;
UPDATE juz SET juz_name_arabic = 'قَدْ أَفْلَحَ' WHERE juz_number = 18;
UPDATE juz SET juz_name_arabic = 'وَقَالَ ٱلَّذِينَ' WHERE juz_number = 19;
UPDATE juz SET juz_name_arabic = 'أَمَّنْ خَلَقَ' WHERE juz_number = 20;
UPDATE juz SET juz_name_arabic = 'أُتْلُ مَآ أُوحِىَ' WHERE juz_number = 21;
UPDATE juz SET juz_name_arabic = 'وَمَن يَقْنُتْ' WHERE juz_number = 22;
UPDATE juz SET juz_name_arabic = 'وَمَآ لِىَ' WHERE juz_number = 23;
UPDATE juz SET juz_name_arabic = 'فَمَنْ أَظْلَمُ' WHERE juz_number = 24;
UPDATE juz SET juz_name_arabic = 'إِلَيْهِ يُرَدُّ' WHERE juz_number = 25;
UPDATE juz SET juz_name_arabic = 'حمٓ' WHERE juz_number = 26;
UPDATE juz SET juz_name_arabic = 'قَالَ فَمَا خَطْبُكُم' WHERE juz_number = 27;
UPDATE juz SET juz_name_arabic = 'قَدْ سَمِعَ ٱللَّهُ' WHERE juz_number = 28;
UPDATE juz SET juz_name_arabic = 'تَبَـٰرَكَ ٱلَّذِى' WHERE juz_number = 29;
UPDATE juz SET juz_name_arabic = 'عَمَّ' WHERE juz_number = 30;

-- Verify the updates
SELECT juz_number, juz_name_arabic, juz_name_english
FROM juz
ORDER BY juz_number;
