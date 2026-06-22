const axios = require('axios');

module.exports = {
  name: 'quran',
  aliases: ['surah', 'para', 'ayat', 'q'],
  category: 'general',
  description: 'Search Quran by Surah, Para (Juz), or specific Ayah with multi-lingual support',
  usage: '.quran [surah/para/ayah] [number] [range]',

  async execute(sock, msg, args, extra) {
    const from = extra.from || msg.key.remoteJid;
    
    // Commands Guidelines if input is empty
    if (!args[0] || !args[1]) {
        return sock.sendMessage(from, {
            text: `╭━━━〔 🗺️ *S Y E D  M D  Q U R A N* 〕━━━👉
┃
┃ ⚠️ *Missing Parameters!*
┃ 📝 *Available Formats:*
┃
┃ 🔹 *By Surah:* \`.quran surah 2 1-5\`
┃ 🔹 *By Para/Sepra:* \`.quran para 1 1-10\`
┃ 🔹 *By Single Ayah:* \`.quran ayat 2:255\` (Ayat-ul-Kursi)
┃
╰━━━━━━━━━━━━━━━━━━━━━━━👉`
        }, { quoted: msg });
    }

    const searchType = args[0].toLowerCase(); // surah, para, ayat
    const targetNumber = args[1]; // number or split query
    const rangeInput = args[2]; // optional range like 1-5

    // Dynamic Loader Graphics
    const initialMsg = await sock.sendMessage(from, { 
        text: `✨ 💠 *S Y E D  M D  I S L A M I C* 💠 ✨\n\n🔍 Searching database for *${searchType.toUpperCase()} ${targetNumber}*...\n⏳ Fetching Arabic, Urdu & English translations parallelly...` 
    }, { quoted: msg });

    try {
      let arabicUrl, urduUrl, englishUrl;
      let titleHeader = '';
      let startAyah = 1;
      let endAyah = 10; // default safe chunk
      let totalAyahsFound = 0;
      let ayahsArrayArabic = [];
      let ayahsArrayUrdu = [];
      let ayahsArrayEnglish = [];

      // ==================== ENGINE 1: SURAH SEARCH ====================
      if (searchType === 'surah' || searchType === 'surah') {
          arabicUrl = `https://api.alquran.cloud/v1/surah/${targetNumber}`;
          urduUrl = `https://api.alquran.cloud/v1/surah/${targetNumber}/ur.ahmedali`;
          englishUrl = `https://api.alquran.cloud/v1/surah/${targetNumber}/en.sahih`;

          const [resA, resU, resE] = await Promise.all([axios.get(arabicUrl), axios.get(urduUrl), axios.get(englishUrl)]);
          
          const sData = resA.data.data;
          totalAyahsFound = sData.numberOfAyahs;
          titleHeader = `📖 *SURAH:* \`${sData.englishName} (${sData.name})\`\n🗺️ *REVELATION:* \`${sData.revelationType}\``;

          // Parsing range safely
          if (rangeInput && rangeInput.includes('-')) {
              const parts = rangeInput.split('-');
              startAyah = parseInt(parts[0]) || 1;
              endAyah = parseInt(parts[1]) || totalAyahsFound;
          } else {
              endAyah = Math.min(totalAyahsFound, 7); // Default to 7 ayats for clear visuals
          }

          ayahsArrayArabic = sData.ayahs.slice(startAyah - 1, endAyah);
          ayahsArrayUrdu = resU.data.data.ayahs.slice(startAyah - 1, endAyah);
          ayahsArrayEnglish = resE.data.data.ayahs.slice(startAyah - 1, endAyah);

      // ==================== ENGINE 2: PARA / JUZ SEARCH ====================
      } else if (searchType === 'para' || searchType === 'juz' || searchType === 'sepra') {
          arabicUrl = `https://api.alquran.cloud/v1/juz/${targetNumber}/quran-simple`;
          urduUrl = `https://api.alquran.cloud/v1/juz/${targetNumber}/ur.ahmedali`;
          englishUrl = `https://api.alquran.cloud/v1/juz/${targetNumber}/en.sahih`;

          const [resA, resU, resE] = await Promise.all([axios.get(arabicUrl), axios.get(urduUrl), axios.get(englishUrl)]);
          
          totalAyahsFound = resA.data.data.ayahs.length;
          titleHeader = `✨ *PARA / SEPRA:* \`${targetNumber}\`\n🔢 *TOTAL AYATS IN JUZ:* \`${totalAyahsFound}\``;

          if (rangeInput && rangeInput.includes('-')) {
              const parts = rangeInput.split('-');
              startAyah = parseInt(parts[0]) || 1;
              endAyah = parseInt(parts[1]) || totalAyahsFound;
          } else {
              endAyah = Math.min(totalAyahsFound, 5); // Default 5 ayats to prevent overflow
          }

          ayahsArrayArabic = resA.data.data.ayahs.slice(startAyah - 1, endAyah);
          ayahsArrayUrdu = resU.data.data.ayahs.slice(startAyah - 1, endAyah);
          ayahsArrayEnglish = resE.data.data.ayahs.slice(startAyah - 1, endAyah);

      // ==================== ENGINE 3: SPECIFIC AYAH SEARCH ====================
      } else if (searchType === 'ayat' || searchType === 'ayah') {
          // Input type expected -> 2:255
          arabicUrl = `https://api.alquran.cloud/v1/ayah/${targetNumber}`;
          urduUrl = `https://api.alquran.cloud/v1/ayah/${targetNumber}/ur.ahmedali`;
          englishUrl = `https://api.alquran.cloud/v1/ayah/${targetNumber}/en.sahih`;

          const [resA, resU, resE] = await Promise.all([axios.get(arabicUrl), axios.get(urduUrl), axios.get(englishUrl)]);
          
          const aData = resA.data.data;
          titleHeader = `🟢 *SPECIFIC AYAH KEY:* \`${targetNumber}\`\n🕌 *SURAH:* \`${aData.surah.englishName}\` | *AYAH:* \`${aData.numberInSurah}\``;
          
          startAyah = 1;
          endAyah = 1;
          ayahsArrayArabic = [aData];
          ayahsArrayUrdu = [resU.data.data];
          ayahsArrayEnglish = [resE.data.data];
      } else {
          return sock.sendMessage(from, { text: "❌ *Error:* Unknown search type! Use `surah`, `para`, or `ayat`." }, { quoted: msg });
      }

      // Safety Guard for Text Lag
      if ((endAyah - startAyah) > 15) {
          return sock.sendMessage(from, { text: `⚠️ *Visual Optimization:* Please select a range of maximum 15 ayats at once to prevent high-end interface lagging. \n💡 *Example:* \`.quran ${searchType} ${targetNumber} 1-10\`` }, { quoted: msg });
      }

      // Build High-End UI Graphics Card
      let quranCard = `⚡ 📲  *S Y E D   M D   A L - Q U R A N*  📲 ⚡\n`;
      quranCard += `╔═════════════════════════╗\n`;
      quranCard += `  ${titleHeader}\n`;
      quranCard += `  🔢 *DISPLAYING:* \`Ayats ${startAyah} - ${endAyah}\`\n`;
      quranCard += `╚═════════════════════════╝\n\n`;

      // Inject Bismillah Graphics if opening from starting of a Surah
      if (searchType === 'surah' && targetNumber !== '1' && targetNumber !== '9' && startAyah === 1) {
          quranCard += `✨ *بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ* ✨\n`;
          quranCard += `_In the name of Allah, the Entirely Merciful, the Especially Merciful._\n`;
          quranCard += `_شروع اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے_\n`;
          quranCard += `─────────────────────────\n\n`;
      }

      // Loop and merge data structures cleanly
      for (let i = 0; i < ayahsArrayArabic.length; i++) {
          let arText = ayahsArrayArabic[i].text;
          let urText = ayahsArrayUrdu[i].text;
          let enText = ayahsArrayEnglish[i].text;
          
          let currentAyahNum = searchType === 'ayat' ? ayahsArrayArabic[i].numberInSurah : (startAyah + i);
          let insideSurahName = searchType === 'para' ? ` (${ayahsArrayArabic[i].surah.englishName})` : '';

          // Strip system inline Bismillah from rendering if it's start of surah
          if (searchType === 'surah' && currentAyahNum === 1 && targetNumber !== '1' && arText.startsWith("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ")) {
              arText = arText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "").trim();
          }

          quranCard += `🟢 *[ AYAH ${currentAyahNum}${insideSurahName} ]* 💠━━━👉\n`;
          quranCard += `▶️ \`${arText}\`\n\n`;
          quranCard += `📝 *URDU:* _${urText}_\n\n`;
          quranCard += `🇬🇧 *ENGLISH:* _${enText}_\n`;
          quranCard += `─────────────────────────\n`;
      }

      // Next page hint system
      if (endAyah < totalAyahsFound && searchType !== 'ayat') {
          quranCard += `\n💡 *Next Track Command:* \`.quran ${searchType} ${targetNumber} ${endAyah + 1}-${Math.min(endAyah + 7, totalAyahsFound)}_\n`;
      }

      // Send the high graphics response
      await sock.sendMessage(from, { text: quranCard, edit: initialMsg.key });

    } catch (err) {
      console.error('Ultimate Quran Engine Error:', err.message);
      return sock.sendMessage(from, { text: "❌ *Engine Error:* Invalid Index number or network timeout. Please verify your data entry!" }, { quoted: msg });
    }
  }
};
          
