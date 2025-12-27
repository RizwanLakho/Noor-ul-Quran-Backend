-- =====================================================
-- Update Surah Arabic Names with Proper Tashkeel
-- =====================================================
-- This script updates the surah_name_arabic column with
-- proper Arabic names including all diacritical marks
-- (Harakat: Fatha, Kasra, Damma, Sukun, Shadda, Tanwin, Mad, etc.)
-- =====================================================

-- Update all 114 Surahs with proper tashkeel
UPDATE surahs SET surah_name_arabic = 'ٱلْفَاتِحَة' WHERE surah_number = 1;
UPDATE surahs SET surah_name_arabic = 'ٱلْبَقَرَة' WHERE surah_number = 2;
UPDATE surahs SET surah_name_arabic = 'آلِ عِمْرَان' WHERE surah_number = 3;
UPDATE surahs SET surah_name_arabic = 'ٱلنِّسَاء' WHERE surah_number = 4;
UPDATE surahs SET surah_name_arabic = 'ٱلْمَائِدَة' WHERE surah_number = 5;
UPDATE surahs SET surah_name_arabic = 'ٱلْأَنْعَام' WHERE surah_number = 6;
UPDATE surahs SET surah_name_arabic = 'ٱلْأَعْرَاف' WHERE surah_number = 7;
UPDATE surahs SET surah_name_arabic = 'ٱلْأَنْفَال' WHERE surah_number = 8;
UPDATE surahs SET surah_name_arabic = 'ٱلتَّوْبَة' WHERE surah_number = 9;
UPDATE surahs SET surah_name_arabic = 'يُونُس' WHERE surah_number = 10;
UPDATE surahs SET surah_name_arabic = 'هُود' WHERE surah_number = 11;
UPDATE surahs SET surah_name_arabic = 'يُوسُف' WHERE surah_number = 12;
UPDATE surahs SET surah_name_arabic = 'ٱلرَّعْد' WHERE surah_number = 13;
UPDATE surahs SET surah_name_arabic = 'إِبْرَاهِيم' WHERE surah_number = 14;
UPDATE surahs SET surah_name_arabic = 'ٱلْحِجْر' WHERE surah_number = 15;
UPDATE surahs SET surah_name_arabic = 'ٱلنَّحْل' WHERE surah_number = 16;
UPDATE surahs SET surah_name_arabic = 'ٱلْإِسْرَاء' WHERE surah_number = 17;
UPDATE surahs SET surah_name_arabic = 'ٱلْكَهْف' WHERE surah_number = 18;
UPDATE surahs SET surah_name_arabic = 'مَرْيَم' WHERE surah_number = 19;
UPDATE surahs SET surah_name_arabic = 'طه' WHERE surah_number = 20;
UPDATE surahs SET surah_name_arabic = 'ٱلْأَنْبِيَاء' WHERE surah_number = 21;
UPDATE surahs SET surah_name_arabic = 'ٱلْحَجّ' WHERE surah_number = 22;
UPDATE surahs SET surah_name_arabic = 'ٱلْمُؤْمِنُون' WHERE surah_number = 23;
UPDATE surahs SET surah_name_arabic = 'ٱلنُّور' WHERE surah_number = 24;
UPDATE surahs SET surah_name_arabic = 'ٱلْفُرْقَان' WHERE surah_number = 25;
UPDATE surahs SET surah_name_arabic = 'ٱلشُّعَرَاء' WHERE surah_number = 26;
UPDATE surahs SET surah_name_arabic = 'ٱلنَّمْل' WHERE surah_number = 27;
UPDATE surahs SET surah_name_arabic = 'ٱلْقَصَص' WHERE surah_number = 28;
UPDATE surahs SET surah_name_arabic = 'ٱلْعَنْكَبُوت' WHERE surah_number = 29;
UPDATE surahs SET surah_name_arabic = 'ٱلرُّوم' WHERE surah_number = 30;
UPDATE surahs SET surah_name_arabic = 'لُقْمَان' WHERE surah_number = 31;
UPDATE surahs SET surah_name_arabic = 'ٱلسَّجْدَة' WHERE surah_number = 32;
UPDATE surahs SET surah_name_arabic = 'ٱلْأَحْزَاب' WHERE surah_number = 33;
UPDATE surahs SET surah_name_arabic = 'سَبَإ' WHERE surah_number = 34;
UPDATE surahs SET surah_name_arabic = 'فَاطِر' WHERE surah_number = 35;
UPDATE surahs SET surah_name_arabic = 'يس' WHERE surah_number = 36;
UPDATE surahs SET surah_name_arabic = 'ٱلصَّافَّات' WHERE surah_number = 37;
UPDATE surahs SET surah_name_arabic = 'ص' WHERE surah_number = 38;
UPDATE surahs SET surah_name_arabic = 'ٱلزُّمَر' WHERE surah_number = 39;
UPDATE surahs SET surah_name_arabic = 'غَافِر' WHERE surah_number = 40;
UPDATE surahs SET surah_name_arabic = 'فُصِّلَت' WHERE surah_number = 41;
UPDATE surahs SET surah_name_arabic = 'ٱلشُّورَىٰ' WHERE surah_number = 42;
UPDATE surahs SET surah_name_arabic = 'ٱلزُّخْرُف' WHERE surah_number = 43;
UPDATE surahs SET surah_name_arabic = 'ٱلدُّخَان' WHERE surah_number = 44;
UPDATE surahs SET surah_name_arabic = 'ٱلْجَاثِيَة' WHERE surah_number = 45;
UPDATE surahs SET surah_name_arabic = 'ٱلْأَحْقَاف' WHERE surah_number = 46;
UPDATE surahs SET surah_name_arabic = 'مُحَمَّد' WHERE surah_number = 47;
UPDATE surahs SET surah_name_arabic = 'ٱلْفَتْح' WHERE surah_number = 48;
UPDATE surahs SET surah_name_arabic = 'ٱلْحُجُرَات' WHERE surah_number = 49;
UPDATE surahs SET surah_name_arabic = 'ق' WHERE surah_number = 50;
UPDATE surahs SET surah_name_arabic = 'ٱلذَّارِيَات' WHERE surah_number = 51;
UPDATE surahs SET surah_name_arabic = 'ٱلطُّور' WHERE surah_number = 52;
UPDATE surahs SET surah_name_arabic = 'ٱلنَّجْم' WHERE surah_number = 53;
UPDATE surahs SET surah_name_arabic = 'ٱلْقَمَر' WHERE surah_number = 54;
UPDATE surahs SET surah_name_arabic = 'ٱلرَّحْمَـٰن' WHERE surah_number = 55;
UPDATE surahs SET surah_name_arabic = 'ٱلْوَاقِعَة' WHERE surah_number = 56;
UPDATE surahs SET surah_name_arabic = 'ٱلْحَدِيد' WHERE surah_number = 57;
UPDATE surahs SET surah_name_arabic = 'ٱلْمُجَادِلَة' WHERE surah_number = 58;
UPDATE surahs SET surah_name_arabic = 'ٱلْحَشْر' WHERE surah_number = 59;
UPDATE surahs SET surah_name_arabic = 'ٱلْمُمْتَحَنَة' WHERE surah_number = 60;
UPDATE surahs SET surah_name_arabic = 'ٱلصَّفّ' WHERE surah_number = 61;
UPDATE surahs SET surah_name_arabic = 'ٱلْجُمُعَة' WHERE surah_number = 62;
UPDATE surahs SET surah_name_arabic = 'ٱلْمُنَافِقُون' WHERE surah_number = 63;
UPDATE surahs SET surah_name_arabic = 'ٱلتَّغَابُن' WHERE surah_number = 64;
UPDATE surahs SET surah_name_arabic = 'ٱلطَّلَاق' WHERE surah_number = 65;
UPDATE surahs SET surah_name_arabic = 'ٱلتَّحْرِيم' WHERE surah_number = 66;
UPDATE surahs SET surah_name_arabic = 'ٱلْمُلْك' WHERE surah_number = 67;
UPDATE surahs SET surah_name_arabic = 'ٱلْقَلَم' WHERE surah_number = 68;
UPDATE surahs SET surah_name_arabic = 'ٱلْحَاقَّة' WHERE surah_number = 69;
UPDATE surahs SET surah_name_arabic = 'ٱلْمَعَارِج' WHERE surah_number = 70;
UPDATE surahs SET surah_name_arabic = 'نُوح' WHERE surah_number = 71;
UPDATE surahs SET surah_name_arabic = 'ٱلْجِنّ' WHERE surah_number = 72;
UPDATE surahs SET surah_name_arabic = 'ٱلْمُزَّمِّل' WHERE surah_number = 73;
UPDATE surahs SET surah_name_arabic = 'ٱلْمُدَّثِّر' WHERE surah_number = 74;
UPDATE surahs SET surah_name_arabic = 'ٱلْقِيَامَة' WHERE surah_number = 75;
UPDATE surahs SET surah_name_arabic = 'ٱلْإِنْسَان' WHERE surah_number = 76;
UPDATE surahs SET surah_name_arabic = 'ٱلْمُرْسَلَات' WHERE surah_number = 77;
UPDATE surahs SET surah_name_arabic = 'ٱلنَّبَإ' WHERE surah_number = 78;
UPDATE surahs SET surah_name_arabic = 'ٱلنَّازِعَات' WHERE surah_number = 79;
UPDATE surahs SET surah_name_arabic = 'عَبَسَ' WHERE surah_number = 80;
UPDATE surahs SET surah_name_arabic = 'ٱلتَّكْوِير' WHERE surah_number = 81;
UPDATE surahs SET surah_name_arabic = 'ٱلْإِنْفِطَار' WHERE surah_number = 82;
UPDATE surahs SET surah_name_arabic = 'ٱلْمُطَفِّفِين' WHERE surah_number = 83;
UPDATE surahs SET surah_name_arabic = 'ٱلْإِنْشِقَاق' WHERE surah_number = 84;
UPDATE surahs SET surah_name_arabic = 'ٱلْبُرُوج' WHERE surah_number = 85;
UPDATE surahs SET surah_name_arabic = 'ٱلطَّارِق' WHERE surah_number = 86;
UPDATE surahs SET surah_name_arabic = 'ٱلْأَعْلَىٰ' WHERE surah_number = 87;
UPDATE surahs SET surah_name_arabic = 'ٱلْغَاشِيَة' WHERE surah_number = 88;
UPDATE surahs SET surah_name_arabic = 'ٱلْفَجْر' WHERE surah_number = 89;
UPDATE surahs SET surah_name_arabic = 'ٱلْبَلَد' WHERE surah_number = 90;
UPDATE surahs SET surah_name_arabic = 'ٱلشَّمْس' WHERE surah_number = 91;
UPDATE surahs SET surah_name_arabic = 'ٱللَّيْل' WHERE surah_number = 92;
UPDATE surahs SET surah_name_arabic = 'ٱلضُّحَىٰ' WHERE surah_number = 93;
UPDATE surahs SET surah_name_arabic = 'ٱلشَّرْح' WHERE surah_number = 94;
UPDATE surahs SET surah_name_arabic = 'ٱلتِّين' WHERE surah_number = 95;
UPDATE surahs SET surah_name_arabic = 'ٱلْعَلَق' WHERE surah_number = 96;
UPDATE surahs SET surah_name_arabic = 'ٱلْقَدْر' WHERE surah_number = 97;
UPDATE surahs SET surah_name_arabic = 'ٱلْبَيِّنَة' WHERE surah_number = 98;
UPDATE surahs SET surah_name_arabic = 'ٱلزَّلْزَلَة' WHERE surah_number = 99;
UPDATE surahs SET surah_name_arabic = 'ٱلْعَادِيَات' WHERE surah_number = 100;
UPDATE surahs SET surah_name_arabic = 'ٱلْقَارِعَة' WHERE surah_number = 101;
UPDATE surahs SET surah_name_arabic = 'ٱلتَّكَاثُر' WHERE surah_number = 102;
UPDATE surahs SET surah_name_arabic = 'ٱلْعَصْر' WHERE surah_number = 103;
UPDATE surahs SET surah_name_arabic = 'ٱلْهُمَزَة' WHERE surah_number = 104;
UPDATE surahs SET surah_name_arabic = 'ٱلْفِيل' WHERE surah_number = 105;
UPDATE surahs SET surah_name_arabic = 'قُرَيْش' WHERE surah_number = 106;
UPDATE surahs SET surah_name_arabic = 'ٱلْمَاعُون' WHERE surah_number = 107;
UPDATE surahs SET surah_name_arabic = 'ٱلْكَوْثَر' WHERE surah_number = 108;
UPDATE surahs SET surah_name_arabic = 'ٱلْكَافِرُون' WHERE surah_number = 109;
UPDATE surahs SET surah_name_arabic = 'ٱلنَّصْر' WHERE surah_number = 110;
UPDATE surahs SET surah_name_arabic = 'ٱلْمَسَد' WHERE surah_number = 111;
UPDATE surahs SET surah_name_arabic = 'ٱلْإِخْلَاص' WHERE surah_number = 112;
UPDATE surahs SET surah_name_arabic = 'ٱلْفَلَق' WHERE surah_number = 113;
UPDATE surahs SET surah_name_arabic = 'ٱلنَّاس' WHERE surah_number = 114;

-- Verify the updates
SELECT surah_number, surah_name_arabic, surah_name_english
FROM surahs
ORDER BY surah_number
LIMIT 20;
